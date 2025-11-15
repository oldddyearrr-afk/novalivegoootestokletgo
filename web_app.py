#!/usr/bin/env python3
from flask import Flask, render_template, jsonify, request
import subprocess
import os
import json
from datetime import datetime
from pathlib import Path
import uuid
import psutil

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
LOGS_DIR = BASE_DIR / "logs"
TELEGRAM_STREAMS_FILE = BASE_DIR / "telegram_streams.json"
PROCESSES = {}

def load_telegram_streams():
    """تحميل قائمة بثوث تليجرام من الملف"""
    if TELEGRAM_STREAMS_FILE.exists():
        with open(TELEGRAM_STREAMS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_telegram_streams(streams):
    """حفظ قائمة بثوث تليجرام"""
    with open(TELEGRAM_STREAMS_FILE, 'w', encoding='utf-8') as f:
        json.dump(streams, f, ensure_ascii=False, indent=2)

def get_stream_status(session_name):
    """التحقق من حالة بث معين"""
    try:
        if session_name in PROCESSES:
            proc = PROCESSES[session_name]
            return proc.poll() is None
        return False
    except:
        return False

@app.route('/')
def index():
    """الصفحة الرئيسية - تليجرام مباشرة"""
    return render_template('telegram_index.html')

@app.route('/api/telegram/streams')
def api_telegram_streams():
    """الحصول على قائمة جميع بثوث تليجرام"""
    streams = load_telegram_streams()
    for stream in streams:
        stream['status'] = 'running' if get_stream_status(stream['session_name']) else 'stopped'
    save_telegram_streams(streams)
    return jsonify({'streams': streams})

@app.route('/api/telegram/stream/add', methods=['POST'])
def api_telegram_add_stream():
    """إضافة بث تليجرام جديد"""
    try:
        data = request.get_json() or {}
        stream_key = data.get('stream_key', '').strip()
        stream_name = data.get('stream_name', '').strip()
        source_url = data.get('source_url', '').strip()
        
        if not stream_key:
            return jsonify({'success': False, 'error': 'يرجى إدخال مفتاح البث (RTMP URL)'}), 400
        
        if not stream_name:
            stream_name = f'بث تليجرام {datetime.now().strftime("%H:%M:%S")}'
        
        stream_id = str(uuid.uuid4())[:8]
        session_name = f'tgstream_{stream_id}'
        
        streams = load_telegram_streams()
        
        new_stream = {
            'id': stream_id,
            'session_name': session_name,
            'name': stream_name,
            'stream_key': stream_key[:30] + '...',
            'source_url': source_url or 'default',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'status': 'starting'
        }
        streams.append(new_stream)
        save_telegram_streams(streams)
        
        # إنشاء ملف لوج للبث
        log_file = LOGS_DIR / f"stream_{stream_id}.log"
        
        # إعداد أمر FFmpeg
        source = source_url if source_url else 'http://soft24f.net/live/6872c3410e8cibopro/22bcpapc/237014.ts'
        
        ffmpeg_cmd = [
            'ffmpeg', '-hide_banner', '-loglevel', 'error',
            '-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_at_eof', '1',
            '-reconnect_delay_max', '10',
            '-timeout', '30000000',
            '-fflags', '+genpts',
            '-analyzeduration', '5000000', '-probesize', '5000000',
            '-i', source,
            '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
            '-profile:v', 'baseline', '-level', '3.1',
            '-vf', "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=25,drawtext=text='t.me/xl9rr':fontsize=30:fontcolor=white@0.85:shadowcolor=black@0.3:shadowx=1:shadowy=1:x=w-mod(t*120\\,w+tw):y=h-th-40",
            '-b:v', '1800k', '-maxrate', '2000k', '-bufsize', '3600k',
            '-g', '50', '-keyint_min', '25', '-sc_threshold', '0',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', '96k', '-ar', '44100', '-ac', '2',
            '-af', 'aresample=async=1',
            '-bsf:v', 'h264_mp4toannexb',
            '-f', 'flv', stream_key
        ]
        
        # بدء البث في الخلفية
        with open(log_file, 'w') as log:
            proc = subprocess.Popen(
                ffmpeg_cmd,
                stdout=log,
                stderr=subprocess.STDOUT,
                preexec_fn=os.setpgrp if os.name != 'nt' else None
            )
        
        PROCESSES[session_name] = proc
        
        import time
        time.sleep(4)
        
        # تحديث الحالة
        if get_stream_status(session_name):
            for stream in streams:
                if stream['id'] == stream_id:
                    stream['status'] = 'running'
            save_telegram_streams(streams)
            return jsonify({'success': True, 'message': 'تم بدء البث إلى تليجرام بنجاح ✅', 'stream_id': stream_id})
        else:
            streams = [s for s in streams if s['id'] != stream_id]
            save_telegram_streams(streams)
            return jsonify({'success': False, 'error': 'فشل بدء البث'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/telegram/stream/stop/<stream_id>', methods=['POST'])
def api_telegram_stop_stream(stream_id):
    """إيقاف بث تليجرام معين"""
    try:
        streams = load_telegram_streams()
        stream = next((s for s in streams if s['id'] == stream_id), None)
        
        if not stream:
            return jsonify({'success': False, 'error': 'البث غير موجود'}), 404
        
        if stream['session_name'] in PROCESSES:
            proc = PROCESSES[stream['session_name']]
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except:
                proc.kill()
            del PROCESSES[stream['session_name']]
        
        import time
        time.sleep(1)
        
        stream['status'] = 'stopped'
        save_telegram_streams(streams)
        
        return jsonify({'success': True, 'message': 'تم إيقاف البث'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/telegram/stream/delete/<stream_id>', methods=['DELETE'])
def api_telegram_delete_stream(stream_id):
    """حذف بث من القائمة"""
    try:
        streams = load_telegram_streams()
        stream = next((s for s in streams if s['id'] == stream_id), None)
        
        if not stream:
            return jsonify({'success': False, 'error': 'البث غير موجود'}), 404
        
        if stream['session_name'] in PROCESSES:
            proc = PROCESSES[stream['session_name']]
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except:
                proc.kill()
            del PROCESSES[stream['session_name']]
        
        streams = [s for s in streams if s['id'] != stream_id]
        save_telegram_streams(streams)
        
        return jsonify({'success': True, 'message': 'تم حذف البث'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/telegram/stream/logs/<stream_id>')
def api_telegram_stream_logs(stream_id):
    """الحصول على سجلات بث معين"""
    try:
        streams = load_telegram_streams()
        stream = next((s for s in streams if s['id'] == stream_id), None)
        
        if not stream:
            return jsonify({'error': 'البث غير موجود'}), 404
        
        log_file = LOGS_DIR / f"stream_{stream_id}.log"
        
        if log_file.exists():
            with open(log_file, 'r') as f:
                logs = f.readlines()[-50:]
                return jsonify({'logs': [log.strip() for log in logs]})
        
        return jsonify({'logs': ['لا توجد سجلات متاحة']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    LOGS_DIR.mkdir(exist_ok=True)
    
    # حذف جميع السجلات القديمة عند بدء التشغيل
    import shutil
    if LOGS_DIR.exists():
        shutil.rmtree(LOGS_DIR)
    LOGS_DIR.mkdir(exist_ok=True)
    
    # دعم render.com - قراءة PORT من متغيرات البيئة
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

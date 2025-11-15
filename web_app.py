
#!/usr/bin/env python3
from flask import Flask, render_template, jsonify, request
import subprocess
import os
import json
from datetime import datetime
from pathlib import Path
import uuid
import signal
import time
import atexit
import sys

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
LOGS_DIR = BASE_DIR / "logs"
TELEGRAM_STREAMS_FILE = BASE_DIR / "telegram_streams.json"
PROCESSES = {}

def check_ffmpeg():
    """التحقق من توفر FFmpeg"""
    try:
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, timeout=5)
        return result.returncode == 0
    except:
        return False

def load_telegram_streams():
    """تحميل قائمة بثوث تليجرام من الملف"""
    if TELEGRAM_STREAMS_FILE.exists():
        try:
            with open(TELEGRAM_STREAMS_FILE, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    return []
                return json.loads(content)
        except (json.JSONDecodeError, Exception) as e:
            print(f"⚠️ خطأ في قراءة الملف: {e}")
            return []
    return []

def save_telegram_streams(streams):
    """حفظ قائمة بثوث تليجرام"""
    try:
        # إنشاء نسخة احتياطية
        if TELEGRAM_STREAMS_FILE.exists():
            backup = TELEGRAM_STREAMS_FILE.with_suffix('.json.bak')
            TELEGRAM_STREAMS_FILE.rename(backup)
        
        with open(TELEGRAM_STREAMS_FILE, 'w', encoding='utf-8') as f:
            json.dump(streams, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ خطأ في حفظ البيانات: {e}")

def get_stream_status(session_name):
    """التحقق من حالة بث معين"""
    try:
        if session_name in PROCESSES:
            proc = PROCESSES[session_name]
            if proc.poll() is None:
                return True
            else:
                # العملية انتهت، نزيلها من القائمة
                del PROCESSES[session_name]
                return False
        return False
    except Exception as e:
        print(f"⚠️ خطأ في فحص الحالة: {e}")
        return False

def start_ffmpeg_process(stream_id, stream_key, source_url, session_name):
    """بدء عملية FFmpeg مبسطة وموثوقة"""
    try:
        log_file = LOGS_DIR / f"stream_{stream_id}.log"
        
        # مصدر افتراضي بسيط للاختبار
        if not source_url or source_url == 'default':
            source = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        else:
            source = source_url
        
        # أوامر FFmpeg محسّنة للاستقرار
        ffmpeg_cmd = [
            'ffmpeg',
            '-loglevel', 'warning',  # تقليل السجلات
            '-re',  # قراءة بسرعة الوقت الحقيقي
            '-stream_loop', '-1',  # تكرار المصدر
            '-reconnect', '1',  # إعادة الاتصال التلقائي
            '-reconnect_streamed', '1',
            '-reconnect_delay_max', '5',
            '-i', source,
            # فيديو محسّن
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-b:v', '1500k',
            '-maxrate', '1500k',
            '-bufsize', '3000k',
            '-vf', 'scale=1280:720',
            '-g', '50',
            '-keyint_min', '25',
            '-pix_fmt', 'yuv420p',
            '-profile:v', 'baseline',
            '-level', '3.1',
            # صوت محسّن
            '-c:a', 'aac',
            '-b:a', '128k',
            '-ar', '44100',
            '-ac', '2',
            # إخراج RTMP محسّن
            '-f', 'flv',
            '-flvflags', 'no_duration_filesize',
            stream_key
        ]
        
        print(f"🚀 بدء البث: {session_name}")
        print(f"📺 المصدر: {source}")
        print(f"🔑 RTMP: {stream_key[:40]}...")
        
        with open(log_file, 'w') as log:
            proc = subprocess.Popen(
                ffmpeg_cmd,
                stdout=log,
                stderr=subprocess.STDOUT,
                start_new_session=True
            )
        
        PROCESSES[session_name] = proc
        print(f"✅ PID: {proc.pid}")
        return proc
        
    except Exception as e:
        print(f"❌ خطأ في بدء البث {session_name}: {e}")
        return None

def restore_active_streams():
    """استعادة البثوث النشطة عند بدء التشغيل"""
    print("🔄 جاري استعادة البثوث النشطة...")
    streams = load_telegram_streams()
    restored = 0
    
    for stream in streams:
        if stream.get('status') == 'running':
            session_name = stream['session_name']
            
            if not get_stream_status(session_name):
                print(f"🔄 إعادة تشغيل: {stream['name']}")
                
                # استخدام المفتاح الكامل المحفوظ
                full_key = stream.get('stream_key_full', stream['stream_key'])
                
                proc = start_ffmpeg_process(
                    stream['id'],
                    full_key,
                    stream.get('source_url', ''),
                    session_name
                )
                
                time.sleep(2)
                
                if proc and get_stream_status(session_name):
                    restored += 1
                    print(f"✅ تم استعادة: {stream['name']}")
                else:
                    stream['status'] = 'stopped'
                    print(f"❌ فشل استعادة: {stream['name']}")
    
    save_telegram_streams(streams)
    print(f"✅ تم استعادة {restored} بث")

def cleanup_processes():
    """تنظيف جميع العمليات عند الإيقاف"""
    print("🛑 جاري إيقاف جميع البثوث...")
    for session_name, proc in list(PROCESSES.items()):
        try:
            proc.terminate()
            proc.wait(timeout=5)
            print(f"🛑 تم إيقاف: {session_name}")
        except:
            try:
                proc.kill()
            except:
                pass
    PROCESSES.clear()

atexit.register(cleanup_processes)

@app.route('/')
def index():
    return render_template('telegram_index.html')

@app.route('/api/telegram/streams')
def api_telegram_streams():
    streams = load_telegram_streams()
    for stream in streams:
        is_running = get_stream_status(stream['session_name'])
        stream['status'] = 'running' if is_running else 'stopped'
    save_telegram_streams(streams)
    return jsonify({'streams': streams})

@app.route('/api/telegram/stream/add', methods=['POST'])
def api_telegram_add_stream():
    try:
        # التحقق من FFmpeg
        if not check_ffmpeg():
            return jsonify({'success': False, 'error': 'FFmpeg غير مثبت على الخادم'}), 500
        
        data = request.get_json() or {}
        stream_key = data.get('stream_key', '').strip()
        stream_name = data.get('stream_name', '').strip()
        source_url = data.get('source_url', '').strip()
        
        if not stream_key:
            return jsonify({'success': False, 'error': 'يرجى إدخال مفتاح البث (RTMP URL)'}), 400
        
        if 'rtmp' not in stream_key.lower():
            return jsonify({'success': False, 'error': 'الرابط يجب أن يحتوي على rtmp'}), 400
        
        if not stream_name:
            stream_name = f'بث تليجرام {datetime.now().strftime("%H:%M:%S")}'
        
        stream_id = str(uuid.uuid4())[:8]
        session_name = f'tgstream_{stream_id}'
        
        streams = load_telegram_streams()
        
        new_stream = {
            'id': stream_id,
            'session_name': session_name,
            'name': stream_name,
            'stream_key': stream_key[:30] + '...',  # للعرض فقط
            'stream_key_full': stream_key,  # المفتاح الكامل
            'source_url': source_url or 'default',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'status': 'starting'
        }
        streams.append(new_stream)
        save_telegram_streams(streams)
        
        # بدء البث
        proc = start_ffmpeg_process(stream_id, stream_key, source_url, session_name)
        
        if not proc:
            streams = [s for s in streams if s['id'] != stream_id]
            save_telegram_streams(streams)
            return jsonify({'success': False, 'error': 'فشل في بدء عملية FFmpeg'}), 500
        
        # حفظ البث كـ running مباشرة
        for stream in streams:
            if stream['id'] == stream_id:
                stream['status'] = 'running'
        save_telegram_streams(streams)
        
        # انتظار أطول للتأكد من استقرار البث
        time.sleep(5)
        
        # التحقق من أن العملية لا تزال تعمل
        if not get_stream_status(session_name):
            # العملية توقفت، نقرأ السجل لمعرفة السبب
            log_file = LOGS_DIR / f"stream_{stream_id}.log"
            error_msg = 'العملية توقفت بعد البدء'
            if log_file.exists():
                try:
                    with open(log_file, 'r') as f:
                        lines = f.readlines()
                        # البحث عن أخطاء FFmpeg
                        error_lines = [l for l in lines if 'error' in l.lower() or 'failed' in l.lower()]
                        if error_lines:
                            error_msg = ''.join(error_lines[-3:])
                except:
                    pass
            
            for stream in streams:
                if stream['id'] == stream_id:
                    stream['status'] = 'stopped'
            save_telegram_streams(streams)
            
            return jsonify({
                'success': False, 
                'error': f'⚠️ البث بدأ لكنه توقف. تحقق من:\n• صحة رابط RTMP\n• صحة مصدر البث\n\nالخطأ: {error_msg}'
            }), 500
        
        return jsonify({'success': True, 'message': 'تم بدء البث بنجاح ✅', 'stream_id': stream_id})
            
    except Exception as e:
        print(f"❌ خطأ: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/telegram/stream/stop/<stream_id>', methods=['POST'])
def api_telegram_stop_stream(stream_id):
    try:
        streams = load_telegram_streams()
        stream = next((s for s in streams if s['id'] == stream_id), None)
        
        if not stream:
            return jsonify({'success': False, 'error': 'البث غير موجود'}), 404
        
        session_name = stream['session_name']
        if session_name in PROCESSES:
            proc = PROCESSES[session_name]
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except:
                proc.kill()
            del PROCESSES[session_name]
        
        time.sleep(1)
        stream['status'] = 'stopped'
        save_telegram_streams(streams)
        
        return jsonify({'success': True, 'message': 'تم إيقاف البث بنجاح ✅'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/telegram/stream/delete/<stream_id>', methods=['DELETE'])
def api_telegram_delete_stream(stream_id):
    try:
        streams = load_telegram_streams()
        stream = next((s for s in streams if s['id'] == stream_id), None)
        
        if not stream:
            return jsonify({'success': False, 'error': 'البث غير موجود'}), 404
        
        session_name = stream['session_name']
        if session_name in PROCESSES:
            proc = PROCESSES[session_name]
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except:
                proc.kill()
            del PROCESSES[session_name]
        
        streams = [s for s in streams if s['id'] != stream_id]
        save_telegram_streams(streams)
        
        log_file = LOGS_DIR / f"stream_{stream_id}.log"
        if log_file.exists():
            log_file.unlink()
        
        return jsonify({'success': True, 'message': 'تم حذف البث بنجاح ✅'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/telegram/stream/logs/<stream_id>')
def api_telegram_stream_logs(stream_id):
    try:
        log_file = LOGS_DIR / f"stream_{stream_id}.log"
        
        if log_file.exists():
            with open(log_file, 'r') as f:
                logs = f.readlines()[-100:]
                return jsonify({'logs': [log.strip() for log in logs]})
        
        return jsonify({'logs': ['لا توجد سجلات متاحة']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("🎬 Telegram Stream Manager")
    print("=" * 50)
    
    # التحقق من FFmpeg
    if not check_ffmpeg():
        print("❌ تحذير: FFmpeg غير مثبت!")
        print("   على Render.com، تأكد من إضافة:")
        print("   apt-get install -y ffmpeg")
        print("   في buildCommand في render.yaml")
    else:
        print("✅ FFmpeg متوفر")
    
    LOGS_DIR.mkdir(exist_ok=True)
    
    # استعادة البثوث النشطة
    restore_active_streams()
    
    # إيجاد منفذ متاح
    port = int(os.environ.get('PORT', 5000))
    
    # محاولة استخدام منفذ بديل إذا كان 5000 محجوزاً
    if port == 5000:
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('0.0.0.0', 5000))
            sock.close()
            if result == 0:
                # المنفذ محجوز، استخدم بديل
                port = 8080
                print(f"⚠️ المنفذ 5000 محجوز، استخدام المنفذ {port}")
        except:
            pass
    
    print(f"🚀 بدء الخادم على المنفذ {port}")
    print("=" * 50)
    
    try:
        app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
    except Exception as e:
        print(f"❌ خطأ في بدء الخادم: {e}")
        sys.exit(1)

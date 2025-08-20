// معالجة النقر على القنوات
        function handleChannelClick(event, channelNumber) {
            event.preventDefault();

            try {
                console.log('النقر على القناة رقم:', channelNumber);

                if (!channelNumber) {
                    showNotification('رقم القناة غير صالح', 'error');
                    return;
                }

                // فتح الرابط باستخدام رقم القناة
                const url = `go:${channelNumber}`;
                console.log('فتح الرابط:', url);
                window.open(url, '_blank');

            } catch (error) {
                console.error('خطأ في معالجة النقر:', error);
                showNotification('خطأ في فتح القناة', 'error');
            }
        }

        // ===== FIREBASE CONFIGURATION =====
        // إعدادات Firebase الصحيحة
        const firebaseConfig = {
            apiKey: "AIzaSyDY3v5WMeJMMKEh0LATA8_bUy9Bx9DnMcI",
            authDomain: "novaagoaldata.firebaseapp.com",
            databaseURL: "https://novaagoaldata-default-rtdb.firebaseio.com",
            projectId: "novaagoaldata",
            storageBucket: "novaagoaldata.firebasestorage.app",
            messagingSenderId: "1039435605690",
            appId: "1:1039435605690:web:46ee4cd6eeab511d604483",
            measurementId: "G-6NXXZB3Z4X"
        };

        // Initialize Firebase
        let database;
        let storage = null;
        let firebaseAvailable = false;

        // Initialize Firebase connection
        function initializeFirebase() {
            try {
                if (typeof firebase !== 'undefined') {
                    firebase.initializeApp(firebaseConfig);
                    database = firebase.database();
                    storage = firebase.storage();
                    firebaseAvailable = true;
                    console.log('Firebase initialized successfully');
                    return true;
                } else {
                    console.log('Firebase SDK not available, using localStorage fallback');
                    firebaseAvailable = false;
                    return false;
                }
            } catch (error) {
                console.warn('Firebase initialization failed, using localStorage fallback:', error);
                firebaseAvailable = false;
                return false;
            }
        }

        // Global Variables
        let currentUser = null;
        let isAdmin = false;

        let currentThemeColor = localStorage.getItem('Nova_color') || 'yellow';
        let settings = JSON.parse(localStorage.getItem('Nova_settings')) || {
            notifications: true,
            autoplay: false,
            quality: 'auto',
            sound: true
        };

        // Admin credentials
        const ADMIN_USERNAME = 'nova_admin';
        const ADMIN_PASSWORD = 'admin2008';

        // Global Variables
        let searchTimeout;



        // Load channel data from Firebase or localStorage
        let channelData = {};

        // Sports Events Data
        let sportsEvents = [];

        // Default sports events
        const defaultSportsEvents = [
            {
                id: "default_1",
                title: "لا توجد أحداث",
                subtitle: "Error",
                image: "",
                link: "go:500",
                status: "upcoming",
                timestamp: Date.now(),
                permanent: true
            }
        ];

        // Default channel data
        const defaultChannelData = {
            'bein-hd': {
                title: 'beIN SPORTS HD',
                baseNumber: 100,
                image: 'https://c.top4top.io/p_3408jzbg31.jpg',
                channels: [
                    'beIN Sports 1 HD',
                    'beIN Sports 2 HD',
                    'beIN Sports 3 HD',
                    'beIN Sports 4 HD',
                    'beIN Sports 5 HD',
                    'beIN Sports 6 HD',
                    'beIN Sports 7 HD',
                    'beIN Sports 8 HD',
                    'beIN Sports 9 HD',
                    'beIN Sports Global HD',
                    'beIN Sports News HD'
                ]
            },
            'fjr-s': {
                title: 'FAJER HD',
                baseNumber: 200,
                image: 'https://l.top4top.io/p_34951cu721.jpg',
                channels: [
                    'FaJER 1 HD',
                    'FaJER 2 HD',
                    'FaJER 3 HD',
                    'FaJER 4 HD',
                    'FaJER 5 HD'
                ]
            },
            'sports-general': {
                title: 'القنوات الرياضية',
                baseNumber: 300,
                image: 'https://c.top4top.io/p_3499bjfz31.jpg',
                channels: [
                    'NRT SPORTS',
                    'AVA SPORTS',
                    'LD SPORTS',
                    'ASTERA SPORTS',
                    'DUHOK SPORTS',
                    'DAISYNA SPORTS'
                ]
            },
            'c-alwanhd': {
                title: 'Alwan Sports HD',
                baseNumber: 400,
                image: 'https://l.top4top.io/p_34951cu721.jpg',
                channels: [
                    'Alwan 1 HD',
                    'Alwan 2 HD',
                    'Alwan 3 HD',
                    'Alwan 4 HD',
                    'Alwan 5 HD',
                    'Alwan 6 HD'
                ]
            },
             'cc-thmanyah': {
                title: 'Thmanyah Sports HD',
                baseNumber: 500,
                image: 'https://thmanyah.com/_next/image?url=%2Fimages%2Ffootball-cover-sm-2.webp&w=1200&q=100',
                channels: [
                    'Thmanyah 1 HD',
                    'Thmanyah 2 HD',
                    'Thmanyah 3 HD'
                ]
            },
        };

        // Simplified Firebase Functions
        let channelDataListener = null;
        let eventsListener = null;

        // Simplified login functions
        function updateUIBasedOnAuth() {
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(element => {
                element.style.display = isAdmin ? 'block' : 'none';
            });
        }

        // Simplified Firebase sync
        function enableChannelDataRealtimeSync() {
            if (!firebaseAvailable || !database) return;
            
            try {
                if (channelDataListener) database.ref('channelData').off('value', channelDataListener);
                
                channelDataListener = database.ref('channelData').on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        channelData = data;
                        localStorage.setItem('Nova_channelData', JSON.stringify(channelData));
                        updateChannelCategoriesDisplay();
                    }
                });
            } catch (error) {
                console.warn('خطأ في مراقبة القنوات:', error);
            }
        }

        function enableEventsRealtimeSync() {
            if (!firebaseAvailable || !database) return;
            
            try {
                if (eventsListener) database.ref('sportsEvents').off('value', eventsListener);
                
                eventsListener = database.ref('sportsEvents').on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data && Array.isArray(data)) {
                        sportsEvents = data;
                        localStorage.setItem('Nova_sportsEvents', JSON.stringify(sportsEvents));
                        updateSportsEventsDisplay();
                    }
                });
            } catch (error) {
                console.warn('خطأ في مراقبة الأحداث:', error);
            }
        }

        // إيقاف المراقبة في الوقت الفعلي
        function disableRealtimeSync() {
            if (database) {
                if (channelDataListener) {
                    database.ref('channelData').off('value', channelDataListener);
                    channelDataListener = null;
                }
                if (eventsListener) {
                    database.ref('sportsEvents').off('value', eventsListener);
                    eventsListener = null;
                }
                console.log('تم إيقاف المراقبة في الوقت الفعلي');
            }
        }

        // تحديث عرض القنوات إذا كانت الصفحة مفتوحة
        function refreshChannelsDisplayIfActive() {
            const channelsSection = document.getElementById('channelsSection');
            if (channelsSection && !channelsSection.classList.contains('hidden')) {
                // إعادة تحميل الفئات إذا كانت صفحة القنوات مفتوحة
                const channelCategoriesMain = document.getElementById('channelCategoriesMain');
                if (channelCategoriesMain && channelCategoriesMain.style.display !== 'none') {
                    // تحديث عرض الفئات مباشرة
                    updateChannelCategoriesDisplay();
                    console.log('تم تحديث عرض القنوات في الوقت الفعلي');
                }

                // تحديث صفحة فرعية للقنوات إذا كانت مفتوحة
                const channelSubPage = document.getElementById('channelSubPage');
                if (channelSubPage && channelSubPage.style.display !== 'none') {
                    const currentCategory = channelSubPage.dataset.currentCategory;
                    if (currentCategory && channelData[currentCategory]) {
                        showChannelSubPage(currentCategory);
                    }
                }
            }
        }

        // تحديث لوحة التحكم إذا كانت مفتوحة
        function refreshAdminDisplayIfActive() {
            const adminSection = document.getElementById('adminSection');
            if (adminSection && !adminSection.classList.contains('hidden')) {
                // تحديث قائمة الفئات
                const categoriesTab = document.getElementById('adminCategoriesTab');
                if (categoriesTab && !categoriesTab.classList.contains('hidden')) {
                    loadCategoriesList();
                    loadChannelCategorySelects();
                }

                // تحديث قائمة القنوات
                const channelsTab = document.getElementById('adminChannelsTab');
                if (channelsTab && !channelsTab.classList.contains('hidden')) {
                    loadChannelCategorySelects();
                    const currentCategory = document.getElementById('channelListCategorySelect')?.value;
                    if (currentCategory) {
                        loadChannelsForCategory();
                    }
                }

                console.log('تم تحديث لوحة التحكم في الوقت الفعلي');
            }
        }

        // تتبع الصفحة الفرعية الحالية للقنوات
        function showChannelSubPage(categoryId) {
            const category = channelData[categoryId];
            if (!category) {
                showNotification('الفئة غير موجودة', 'error');
                return;
            }

            // إخفاء الصفحة الرئيسية وإظهار الصفحة الفرعية
            document.getElementById('channelCategoriesMain').style.display = 'none';
            const subPage = document.getElementById('channelSubPage');
            subPage.style.display = 'block';
            subPage.dataset.currentCategory = categoryId; // حفظ الفئة الحالية

            // تحديث العنوان
            document.getElementById('channelSubTitle').textContent = category.title;

            // تحديث شبكة القنوات
            const subGrid = document.getElementById('channelSubGrid');
            let html = '';

            category.channels.forEach((channel, index) => {
                const channelName = typeof channel === 'string' ? channel : channel.name;
                const channelNumber = category.baseNumber + index;

                html += `
                    <div class="channel-item-wrapper">
                        <div class="channel-item" onclick="handleChannelClick(event, ${channelNumber})" style="cursor: pointer;">
                            <div class="channel-logo">
                                ${getChannelLogo(channelName, categoryId)}
                            </div>
                            <div class="channel-info">
                                <div class="channel-name">${channelName}</div>
                                <div class="channel-quality">HD</div>
                            </div>
                            <div class="channel-status"></div>
                        </div>
                    </div>
                `;
            });

            subGrid.innerHTML = html;
        }

        async function loadChannelDataFromFirebase() {
            if (!firebaseAvailable || !database) {
                loadChannelDataFromLocalStorage();
                return false;
            }

            try {
                const snapshot = await database.ref('channelData').once('value');
                const data = snapshot.val();

                if (data) {
                    channelData = data;
                    localStorage.setItem('Nova_channelData', JSON.stringify(channelData));
                    enableChannelDataRealtimeSync();
                    return true;
                }

                channelData = JSON.parse(JSON.stringify(defaultChannelData));
                await saveChannelDataToFirebase();
                return true;

            } catch (error) {
                console.warn('خطأ Firebase:', error);
                loadChannelDataFromLocalStorage();
                return false;
            }
        }

        async function saveChannelDataToFirebase() {
            if (!firebaseAvailable || !database) {
                console.log('Firebase غير متاح، حفظ القنوات محلياً فقط');
                return saveChannelDataToLocalStorage();
            }

            try {
                console.log('حفظ بيانات القنوات في Firebase...');

                // تحقق من صحة بيانات القنوات
                if (!channelData || typeof channelData !== 'object') {
                    console.warn('بيانات القنوات غير صحيحة، استخدام البيانات الافتراضية');
                    channelData = JSON.parse(JSON.stringify(defaultChannelData));
                }

                // تنظيف البيانات وإزالة قنوات SSC
                const cleanChannelData = {};
                
                Object.entries(channelData).forEach(([categoryId, category]) => {
                    // تجاهل قنوات SSC
                    if (categoryId === 'ssc') {
                        console.log('تم تجاهل قنوات SSC أثناء الحفظ');
                        return;
                    }
                    
                    // التحقق من صحة بيانات الفئة
                    if (!category || typeof category !== 'object') return;
                    if (!category.title || !category.baseNumber) return;
                    if (!Array.isArray(category.channels)) return;
                    
                    cleanChannelData[categoryId] = {
                        title: category.title,
                        baseNumber: parseInt(category.baseNumber) || 0,
                        image: category.image || 'https://c.top4top.io/p_3499bjfz31.jpg',
                        channels: category.channels.filter(channel => {
                            if (typeof channel === 'string') return channel.trim() !== '';
                            if (typeof channel === 'object' && channel.name) return channel.name.trim() !== '';
                            return false;
                        }).map(channel => {
                            if (typeof channel === 'string') {
                                return { name: channel.trim(), image: null };
                            }
                            return {
                                name: channel.name.trim(),
                                image: channel.image || null
                            };
                        }),
                        lastModified: Date.now()
                    };
                });

                // اختبار الاتصال أولاً
                try {
                    await database.ref('.info/connected').once('value');
                } catch (connectionError) {
                    throw new Error('فقدان الاتصال بـ Firebase');
                }

                // حفظ باستخدام retry mechanism
                let retryCount = 0;
                const maxRetries = 3;
                let lastError = null;

                while (retryCount < maxRetries) {
                    try {
                        await database.ref('channelData').set(cleanChannelData);
                        console.log('تم الحفظ في Firebase بنجاح');
                        break;
                    } catch (setError) {
                        lastError = setError;
                        retryCount++;
                        
                        if (retryCount >= maxRetries) {
                            throw new Error(`فشل الحفظ بعد ${maxRetries} محاولات: ${setError.message}`);
                        }
                        
                        console.log(`محاولة إعادة حفظ القنوات ${retryCount}/${maxRetries}`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                    }
                }

                // تحديث البيانات المحلية
                channelData = cleanChannelData;
                
                // حفظ محلي مع معالجة الأخطاء
                try {
                    localStorage.setItem('Nova_channelData', JSON.stringify(cleanChannelData));
                    
                    // إضافة نسخة احتياطية
                    localStorage.setItem('Nova_channelData_backup', JSON.stringify({
                        data: cleanChannelData,
                        timestamp: Date.now(),
                        version: '2.0',
                        source: 'firebase_sync'
                    }));
                } catch (localStorageError) {
                    console.warn('تحذير: فشل في الحفظ المحلي للقنوات:', localStorageError);
                }

                console.log(`تم حفظ ${Object.keys(cleanChannelData).length} فئة قنوات في Firebase بنجاح`);
                return true;

            } catch (error) {
                console.error('خطأ في حفظ بيانات القنوات في Firebase:', error.message || error);
                console.log('التراجع للحفظ المحلي للقنوات...');
                
                try {
                    const localSaveResult = saveChannelDataToLocalStorage();
                    if (localSaveResult) {
                        console.log('تم الحفظ المحلي للقنوات كبديل بنجاح');
                        return true;
                    }
                } catch (localError) {
                    console.error('فشل أيضاً في الحفظ المحلي للقنوات:', localError);
                }
                
                return false;
            }
        }

        async function loadSportsEventsFromFirebase() {
            if (!firebaseAvailable || !database) {
                console.log('Firebase غير متاح، تحميل الأحداث محلياً');
                loadSportsEventsFromLocalStorage();
                updateSportsEventsDisplay();
                return false;
            }

            try {
                console.log('محاولة تحميل الأحداث الرياضية من Firebase...');
                const snapshot = await database.ref('sportsEvents').once('value');
                const data = snapshot.val();

                if (data && Array.isArray(data) && data.length > 0) {
                    // تحقق محسن من صحة البيانات مع إضافة المعرفات المفقودة
                    const validEvents = data.filter(event => 
                        event && 
                        event.title && 
                        event.subtitle && 
                        event.link && 
                        event.status
                    ).map(event => ({
                        ...event,
                        id: event.id || generateUniqueId(),
                        timestamp: event.timestamp || Date.now(),
                        permanent: event.permanent || false
                    }));

                    if (validEvents.length > 0) {
                        sportsEvents = validEvents;

                        // حفظ البيانات المحدثة محلياً وفي Firebase
                        localStorage.setItem('Nova_sportsEvents', JSON.stringify(validEvents));

                        // إعادة حفظ في Firebase إذا تم إضافة معرفات جديدة
                        const hasNewIds = validEvents.some(event => !data.find(d => d.id === event.id));
                        if (hasNewIds) {
                            await database.ref('sportsEvents').set(validEvents);
                        }

                        console.log(`تم تحميل ${validEvents.length} حدث رياضي من Firebase بنجاح`);
                        updateSportsEventsDisplay();

                        // تفعيل المراقبة في الوقت الفعلي بعد التحميل الأول
                        enableEventsRealtimeSync();

                        return true;
                    } else {
                        console.warn('البيانات المحملة من Firebase غير صالحة');
                    }
                }

                // إذا لم توجد بيانات صالحة، استخدم البيانات الافتراضية
                console.log('لا توجد أحداث صالحة في Firebase، استخدام البيانات الافتراضية');
                sportsEvents = [...defaultSportsEvents];
                await saveSportsEventsToFirebase();
                updateSportsEventsDisplay();
                return true;

            } catch (error) {
                console.error('خطأ في تحميل الأحداث من Firebase:', error.message || error);
                loadSportsEventsFromLocalStorage();
                updateSportsEventsDisplay();
                return false;
            }
        }

        async function saveSportsEventsToFirebase() {
            if (!firebaseAvailable || !database) {
                console.log('Firebase غير متاح، حفظ الأحداث محلياً فقط');
                return saveSportsEventsToLocalStorage();
            }

            try {
                console.log('حفظ الأحداث الرياضية في Firebase...');

                // تحقق من صحة بيانات الأحداث
                if (!Array.isArray(sportsEvents)) {
                    console.warn('بيانات الأحداث غير صحيحة، استخدام البيانات الافتراضية');
                    sportsEvents = [...defaultSportsEvents];
                }

                // تنظيف البيانات قبل الحفظ مع معالجة محسنة للأخطاء
                const cleanEvents = sportsEvents.filter(event => {
                    if (!event || typeof event !== 'object') return false;
                    if (!event.title || typeof event.title !== 'string' || !event.title.trim()) return false;
                    if (!event.subtitle || typeof event.subtitle !== 'string' || !event.subtitle.trim()) return false;
                    if (!event.status || typeof event.status !== 'string') return false;
                    return true;
                }).map(event => ({
                    id: event.id || generateUniqueId(),
                    title: event.title.trim(),
                    subtitle: event.subtitle.trim(),
                    image: event.image || null,
                    link: event.link || null,
                    status: event.status,
                    timestamp: event.timestamp || Date.now(),
                    category: event.category || 'general',
                    permanent: event.permanent || false,
                    lastModified: Date.now()
                }));

                if (cleanEvents.length === 0) {
                    console.warn('لا توجد أحداث صالحة للحفظ، استخدام البيانات الافتراضية');
                    cleanEvents.push(...defaultSportsEvents.map(event => ({
                        ...event,
                        id: event.id || generateUniqueId(),
                        timestamp: event.timestamp || Date.now(),
                        category: event.category || 'general',
                        permanent: true,
                        lastModified: Date.now()
                    })));
                }

                // اختبار الاتصال أولاً
                try {
                    await database.ref('.info/connected').once('value');
                } catch (connectionError) {
                    throw new Error('فقدان الاتصال بـ Firebase');
                }

                // حفظ باستخدام set مع retry mechanism محسن
                let retryCount = 0;
                const maxRetries = 3;
                let lastError = null;

                while (retryCount < maxRetries) {
                    try {
                        await database.ref('sportsEvents').set(cleanEvents);
                        console.log('تم الحفظ في Firebase بنجاح');
                        break;
                    } catch (setError) {
                        lastError = setError;
                        retryCount++;
                        
                        if (retryCount >= maxRetries) {
                            throw new Error(`فشل الحفظ بعد ${maxRetries} محاولات: ${setError.message}`);
                        }
                        
                        console.log(`محاولة إعادة الحفظ ${retryCount}/${maxRetries}`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                    }
                }

                // تحديث المتغير المحلي والتخزين المحلي
                sportsEvents = cleanEvents;
                
                // حفظ محلي مع معالجة الأخطاء
                try {
                    localStorage.setItem('Nova_sportsEvents', JSON.stringify(cleanEvents));
                    
                    // إضافة نسخة احتياطية إضافية
                    localStorage.setItem('Nova_sportsEvents_backup', JSON.stringify({
                        data: cleanEvents,
                        timestamp: Date.now(),
                        version: '2.0',
                        source: 'firebase_sync'
                    }));
                } catch (localStorageError) {
                    console.warn('تحذير: فشل في الحفظ المحلي:', localStorageError);
                }

                console.log(`تم حفظ ${cleanEvents.length} حدث رياضي في Firebase بنجاح`);

                // تحديث العرض
                updateSportsEventsDisplay();
                return true;

            } catch (error) {
                console.error('خطأ في حفظ الأحداث في Firebase:', error.message || error);
                console.log('التراجع للحفظ المحلي...');
                
                try {
                    const localSaveResult = saveSportsEventsToLocalStorage();
                    if (localSaveResult) {
                        console.log('تم الحفظ المحلي كبديل بنجاح');
                        return true;
                    }
                } catch (localError) {
                    console.error('فشل أيضاً في الحفظ المحلي:', localError);
                }
                
                return false;
            }
        }

        

        // Fallback functions for localStorage
        function loadChannelDataFromLocalStorage() {
            try {
                const savedData = localStorage.getItem('Nova_channelData');
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    if (parsedData && typeof parsedData === 'object') {
                        channelData = parsedData;

                        // حذف قنوات SSC إذا وجدت
                        if (channelData.ssc) {
                            console.log('تم حذف قنوات SSC من البيانات المحلية');
                            delete channelData.ssc;
                            saveChannelDataToLocalStorage();
                        }

                        for (const categoryId in channelData) {
                            const category = channelData[categoryId];
                            if (!category.title || !category.baseNumber || !Array.isArray(category.channels)) {
                                console.warn(`بيانات غير صحيحة للفئة ${categoryId}، استخدام البيانات الافتراضية`);
                                channelData = JSON.parse(JSON.stringify(defaultChannelData));
                                saveChannelDataToLocalStorage();
                                break;
                            }
                            category.channels = category.channels.map(channel => {
                                if (typeof channel === 'string') {
                                    return { name: channel, image: null };
                                }
                                return channel;
                            });
                        }
                    } else {
                        throw new Error('بيانات غير صحيحة');
                    }
                } else {
                    channelData = JSON.parse(JSON.stringify(defaultChannelData));
                    saveChannelDataToLocalStorage();
                }
            } catch (e) {
                console.warn('خطأ في تحميل بيانات القنوات، استخدام البيانات الافتراضية:', e);
                channelData = JSON.parse(JSON.stringify(defaultChannelData));
                saveChannelDataToLocalStorage();
            }
        }

        function loadSportsEventsFromLocalStorage() {
            try {
                // محاولة تحميل البيانات الأساسية أولاً
                const savedEvents = localStorage.getItem('Nova_sportsEvents');

                if (savedEvents) {
                    const parsedEvents = JSON.parse(savedEvents);
                    if (Array.isArray(parsedEvents) && parsedEvents.length > 0) {
                        // إضافة معرفات فريدة للأحداث التي لا تحتوي عليها
                        sportsEvents = parsedEvents.map(event => ({
                            ...event,
                            id: event.id || generateUniqueId(),
                            timestamp: event.timestamp || Date.now(),
                            permanent: event.permanent || false
                        }));

                        console.log(`تم تحميل ${sportsEvents.length} حدث من التخزين المحلي`);
                    } else {
                        throw new Error('بيانات غير صحيحة أو فارغة');
                    }
                } else {
                    // محاولة استعادة النسخة الاحتياطية
                    const backupData = localStorage.getItem('Nova_sportsEvents_backup');
                    if (backupData) {
                        const backup = JSON.parse(backupData);
                        if (backup.data && Array.isArray(backup.data)) {
                            console.log('استعادة البيانات من النسخة الاحتياطية');
                            sportsEvents = backup.data;
                            // إعادة حفظ البيانات المستعادة
                            localStorage.setItem('Nova_sportsEvents', JSON.stringify(sportsEvents));
                        } else {
                            throw new Error('نسخة احتياطية غير صالحة');
                        }
                    } else {
                        throw new Error('لا توجد بيانات محفوظة');
                    }
                }

                // تحديث العرض مباشرة بعد التحميل
                updateSportsEventsDisplay();

            } catch (e) {
                console.warn('خطأ في تحميل بيانات الأحداث، استخدام البيانات الافتراضية:', e);
                sportsEvents = [...defaultSportsEvents.map(event => ({
                    ...event,
                    id: event.id || generateUniqueId(),
                    timestamp: event.timestamp || Date.now(),
                    permanent: true
                }))];
                saveSportsEventsToLocalStorage();
                updateSportsEventsDisplay();
            }
        }

        function saveSportsEventsToLocalStorage() {
            try {
                // التأكد من وجود معرفات فريدة لجميع الأحداث
                const eventsWithIds = sportsEvents.map(event => ({
                    ...event,
                    id: event.id || generateUniqueId(),
                    timestamp: event.timestamp || Date.now(),
                    lastModified: Date.now()
                }));

                // حفظ البيانات الأساسية
                localStorage.setItem('Nova_sportsEvents', JSON.stringify(eventsWithIds));

                // حفظ نسخة احتياطية
                localStorage.setItem('Nova_sportsEvents_backup', JSON.stringify({
                    data: eventsWithIds,
                    timestamp: Date.now(),
                    version: '2.0'
                }));

                // تحديث البيانات في الذاكرة
                sportsEvents = eventsWithIds;

                console.log(`تم حفظ ${eventsWithIds.length} حدث محلياً مع النسخة الاحتياطية`);
                return true;

            } catch (e) {
                console.error('خطأ في حفظ بيانات الأحداث:', e);
                return false;
            }
        }

        function saveChannelDataToLocalStorage() {
            try {
                // حذف قنوات SSC إذا وجدت قبل الحفظ
                const dataToSave = { ...channelData };
                if (dataToSave.ssc) {
                    delete dataToSave.ssc;
                }

                localStorage.setItem('Nova_channelData', JSON.stringify(dataToSave));
                channelData = dataToSave; // تحديث البيانات في الذاكرة
                console.log('تم حفظ البيانات محلياً بنجاح');
                return true;
            } catch (e) {
                console.error('خطأ في حفظ بيانات القنوات:', e);
                return false;
            }
        }

        // Unified functions that use Firebase when available
        async function loadChannelData() {
            await loadChannelDataFromFirebase();
        }

        async function saveChannelData() {
            return await saveChannelDataToFirebase();
        }

        async function loadSportsEvents() {
            await loadSportsEventsFromFirebase();
        }

        async function saveSportsEvents() {
            return await saveSportsEventsToFirebase();
        }

        // وظيفة لإعادة الاتصال بـ Firebase في حالة انقطاع الاتصال
        async function reconnectToFirebase() {
            if (!firebaseAvailable) return false;

            try {
                console.log('محاولة إعادة الاتصال بـ Firebase...');
                const isConnected = await testFirebaseConnection();

                if (isConnected) {
                    enableChannelDataRealtimeSync();
                    enableEventsRealtimeSync();
                    console.log('تم إعادة الاتصال بـ Firebase بنجاح');
                    showNotification('تم إعادة الاتصال بقاعدة البيانات', 'success', 3000);
                    return true;
                }
                return false;
            } catch (error) {
                console.error('فشل في إعادة الاتصال:', error);
                return false;
            }
        }

        // مراقبة حالة الاتصال بالإنترنت
        function setupConnectionMonitoring() {
            window.addEventListener('online', async () => {
                console.log('تم استعادة الاتصال بالإنترنت');
                showNotification('تم استعادة الاتصال بالإنترنت', 'info', 2000);

                // محاولة إعادة الاتصال بـ Firebase
                setTimeout(async () => {
                    await reconnectToFirebase();
                }, 1000);
            });

            window.addEventListener('offline', () => {
                console.log('تم فقدان الاتصال بالإنترنت');
                showNotification('تم فقدان الاتصال - سيتم استخدام البيانات المحلية', 'error', 3000);
            });
        }

        // وظيفة للتحقق من صحة اتصال Firebase
        async function testFirebaseConnection() {
            if (!firebaseAvailable || !database) {
                return false;
            }

            try {
                console.log('اختبار الاتصال بـ Firebase...');
                await database.ref('.info/connected').once('value');
                console.log('تم الاتصال بـ Firebase بنجاح');
                return true;
            } catch (error) {
                console.error('فشل في الاتصال بـ Firebase:', error);
                return false;
            }
        }



        // Simplified app initialization
        async function initializeApp() {
            try {
                initializeFirebase();
                
                // Load local data first for speed
                loadChannelDataFromLocalStorage();
                loadSportsEventsFromLocalStorage();
                
                // Try Firebase in background
                if (firebaseAvailable) {
                    setTimeout(async () => {
                        try {
                            await loadChannelData();
                            await loadSportsEvents();
                            console.log('Firebase data loaded');
                        } catch (error) {
                            console.warn('Firebase error:', error);
                            firebaseAvailable = false;
                        }
                    }, 100);
                }
                
                return true;
            } catch (error) {
                console.error('App init error:', error);
                return false;
            }
        }





        // Initialize app properly - محسن للسرعة مع دعم Android TV
        async function startApp() {
            try {
                // تحميل البيانات المحلية أولاً لعرض سريع
                loadChannelDataFromLocalStorage();
                loadSportsEventsFromLocalStorage();
                
                // عرض المحتوى فوراً
                updateSportsEventsDisplay();
                updateChannelCategoriesDisplay();
                
                // تهيئة Firebase في الخلفية
                setTimeout(async () => {
                    try {
                        await initializeApp();
                    } catch (error) {
                        console.warn('خطأ في تهيئة Firebase، سيستمر التطبيق بالبيانات المحلية:', error);
                    }
                }, 50);
                
                // تهيئة Android TV
                initializeAndroidTV();
                
                console.log('تم تهيئة التطبيق بنجاح');
            } catch (error) {
                console.error('خطأ في بدء التطبيق:', error);
                // Fallback to localStorage
                loadChannelDataFromLocalStorage();
                loadSportsEventsFromLocalStorage();
                updateSportsEventsDisplay();
                updateChannelCategoriesDisplay();
            }
        }

        // وظائف Android TV الإضافية
        function initializeAndroidTV() {
            // تحقق من Android TV
            if (tvRemote && tvRemote.isAndroidTV) {
                console.log('تم اكتشاف Android TV - تفعيل الميزات المحسنة');
                
                // إظهار رسالة ترحيب للتلفاز
                setTimeout(() => {
                    showTVWelcomeMessage();
                }, 2000);
                
                // إعداد اختصارات الريموت
                setupTVShortcuts();
                
                // تحسين الأداء للتلفاز
                optimizeForTV();
                
                // مراقبة حالة الشبكة
                monitorNetworkForTV();
            }
        }

        function showTVWelcomeMessage() {
            const overlay = document.getElementById('tvOverlay');
            if (overlay) {
                overlay.classList.add('active');
                setTimeout(() => {
                    overlay.classList.remove('active');
                }, 4000);
            }
        }

        function setupTVShortcuts() {
            // اختصارات إضافية لـ Android TV
            document.addEventListener('keydown', function(event) {
                switch(event.key) {
                    case 'F1':
                        event.preventDefault();
                        showSection('live');
                        break;
                    case 'F2':
                        event.preventDefault();
                        showSection('channels');
                        break;
                    case 'F3':
                        event.preventDefault();
                        showSection('settings');
                        break;
                    case 'F4':
                        event.preventDefault();
                        toggleSidebar();
                        break;
                }
            });
        }

        function optimizeForTV() {
            // تحسين الأداء للتلفاز
            document.body.classList.add('tv-optimized');
            
            // تقليل الحركات للأجهزة الضعيفة
            if (navigator.hardwareConcurrency < 4) {
                document.body.classList.add('low-performance-mode');
            }
            
            // تحسين التمرير للتلفاز
            const smoothScroll = {
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            };
            
            // إعداد التمرير المحسن
            window.tvScrollOptions = smoothScroll;
        }

        function monitorNetworkForTV() {
            // مراقبة حالة الشبكة لـ Android TV
            if ('connection' in navigator) {
                const connection = navigator.connection;
                
                function updateConnectionStatus() {
                    const isSlowConnection = connection.effectiveType === '2g' || 
                                          connection.effectiveType === 'slow-2g';
                    
                    if (isSlowConnection) {
                        document.body.classList.add('slow-connection');
                        showNotification('اتصال إنترنت بطيء - تم تفعيل وضع توفير البيانات', 'info', 5000);
                    } else {
                        document.body.classList.remove('slow-connection');
                    }
                }
                
                connection.addEventListener('change', updateConnectionStatus);
                updateConnectionStatus();
            }
        }

        // تحسين معالجة الأخطاء لـ Android TV
        function handleTVError(error, context) {
            console.error(`خطأ في Android TV (${context}):`, error);
            
            // إظهار رسالة خطأ مُحسنة للتلفاز
            const errorMessage = {
                'network': 'تحقق من اتصال الإنترنت',
                'loading': 'فشل في تحميل المحتوى',
                'playback': 'مشكلة في تشغيل الفيديو',
                'default': 'حدث خطأ غير متوقع'
            };
            
            showNotification(
                errorMessage[context] || errorMessage.default, 
                'error', 
                5000
            );
        }

        // تنظيف المراقبة عند إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            disableRealtimeSync();
        });

        // تنظيف المراقبة عند فقدان التركيز لفترة طويلة
        let visibilityTimeout;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // إيقاف المراقبة بعد 5 دقائق من عدم النشاط
                visibilityTimeout = setTimeout(() => {
                    disableRealtimeSync();
                    console.log('تم إيقاف المراقبة في الوقت الفعلي بسبب عدم النشاط');
                }, 5 * 60 * 1000);
            } else {
                // إعادة تفعيل المراقبة عند العودة
                if (visibilityTimeout) {
                    clearTimeout(visibilityTimeout);
                }
                if (firebaseAvailable && database) {
                    enableChannelDataRealtimeSync();
                    enableEventsRealtimeSync();
                    console.log('تم إعادة تفعيل المراقبة في الوقت الفعلي');
                    if (isAdminMode()) {
                        showNotification('تم إعادة تفعيل المزامنة التلقائية', 'info', 2000);
                    }
                }
            }
        });

        // توليد رقم تلقائي للأحداث
        function generateEventNumber() {
            // العثور على أعلى رقم مستخدم
            let highestNumber = 499; // البداية من 500

            sportsEvents.forEach(event => {
                if (event.link && event.link.startsWith('go:')) {
                    const number = parseInt(event.link.replace('go:', ''));
                    if (!isNaN(number) && number > highestNumber) {
                        highestNumber = number;
                    }
                }
            });

            const newNumber = highestNumber + 1;
            const eventLinkInput = document.getElementById('newEventLink');
            if (eventLinkInput) {
                eventLinkInput.value = `go:${newNumber}`;
                showNotification(`تم توليد الرقم: go:${newNumber}`, 'success');
            }
        }

        // توليد رقم تلقائي للأحداث في التعديل
        function generateEditEventNumber() {
            let highestNumber = 499;

            sportsEvents.forEach(event => {
                if (event.link && event.link.startsWith('go:')) {
                    const number = parseInt(event.link.replace('go:', ''));
                    if (!isNaN(number) && number > highestNumber) {
                        highestNumber = number;
                    }
                }
            });

            const newNumber = highestNumber + 1;
            const eventLinkInput = document.getElementById('editEventLink');
            if (eventLinkInput) {
                eventLinkInput.value = `go:${newNumber}`;
                showNotification(`تم توليد الرقم: go:${newNumber}`, 'success');
            }
        }

        // Simplified backup function
        function downloadBackupData() {
            if (!isAdminMode()) {
                showNotification('هذه الميزة متاحة للمشرفين فقط', 'error');
                return;
            }

            const backupData = { sportsEvents, timestamp: new Date().toISOString() };
            const dataStr = JSON.stringify(backupData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `nova-backup-${Date.now()}.json`;
            link.click();
            showNotification('تم تحميل النسخة الاحتياطية', 'success');
        }

        // التحقق من وضع الأدمن
        function isAdminMode() {
            return document.getElementById('adminSection') && !document.getElementById('adminSection').classList.contains('hidden');
        }

        // وظيفة الحفظ التلقائي للأحداث الرياضية والقنوات
        async function autoSaveAllChanges(buttonElement) {
            if (!isAdminMode()) {
                showNotification('هذه الميزة متاحة للمشرفين فقط', 'error');
                return;
            }

            // التحقق من وجود الزر
            let button = buttonElement;
            if (!button && event && event.target) {
                button = event.target;
            }
            
            if (!button) {
                // البحث عن الزر في DOM إذا لم يتم تمريره
                button = document.querySelector('[onclick*="autoSaveAllChanges"]');
            }

            let originalContent = '';
            if (button) {
                originalContent = button.innerHTML;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
                button.disabled = true;
            }

            let savedSuccessfully = false;
            const results = {
                events: false,
                channels: false
            };

            try {
                showNotification('بدء عملية الحفظ التلقائي...', 'info', 2000);
                
                // حفظ الأحداث الرياضية
                if (sportsEvents && sportsEvents.length > 0) {
                    console.log('حفظ الأحداث الرياضية...');
                    
                    try {
                        results.events = await saveSportsEvents();
                        if (results.events) {
                            console.log('تم حفظ الأحداث الرياضية بنجاح');
                        }
                    } catch (eventsError) {
                        console.error('خطأ في حفظ الأحداث:', eventsError);
                        // محاولة الحفظ المحلي للأحداث
                        try {
                            saveSportsEventsToLocalStorage();
                            results.events = true;
                            console.log('تم الحفظ المحلي للأحداث كبديل');
                        } catch (localEventsError) {
                            console.error('فشل الحفظ المحلي للأحداث:', localEventsError);
                        }
                    }
                }

                // حفظ بيانات القنوات
                if (channelData && Object.keys(channelData).length > 0) {
                    console.log('حفظ بيانات القنوات...');
                    
                    try {
                        results.channels = await saveChannelData();
                        if (results.channels) {
                            console.log('تم حفظ بيانات القنوات بنجاح');
                        }
                    } catch (channelsError) {
                        console.error('خطأ في حفظ القنوات:', channelsError);
                        // محاولة الحفظ المحلي للقنوات
                        try {
                            saveChannelDataToLocalStorage();
                            results.channels = true;
                            console.log('تم الحفظ المحلي للقنوات كبديل');
                        } catch (localChannelsError) {
                            console.error('فشل الحفظ المحلي للقنوات:', localChannelsError);
                        }
                    }
                }

                // تحديد نجاح العملية
                savedSuccessfully = results.events || results.channels;

                if (savedSuccessfully) {
                    let successMessage = 'تم الحفظ التلقائي بنجاح: ';
                    const savedItems = [];
                    
                    if (results.events) savedItems.push('الأحداث الرياضية');
                    if (results.channels) savedItems.push('بيانات القنوات');
                    
                    successMessage += savedItems.join(' و ');
                    
                    showNotification(successMessage, 'success', 4000);
                    
                    // تحديث العروض
                    updateSportsEventsDisplay();
                    updateChannelCategoriesDisplay();
                    
                    // تسجيل العملية
                    console.log('تم إكمال الحفظ التلقائي بنجاح:', results);
                    
                } else {
                    throw new Error('فشل في حفظ جميع البيانات');
                }

            } catch (error) {
                console.error('خطأ في الحفظ التلقائي:', error);
                showNotification(`فشل في الحفظ التلقائي: ${error.message || 'خطأ غير محدد'}`, 'error', 5000);
                
            } finally {
                // إعادة تعيين حالة الزر
                if (button) {
                    button.innerHTML = originalContent;
                    button.disabled = false;
                }
                
                // رسالة إتمام العملية
                setTimeout(() => {
                    if (savedSuccessfully) {
                        showNotification('عملية الحفظ التلقائي اكتملت', 'info', 2000);
                    }
                }, 1000);
            }

            return savedSuccessfully;
        }

        // إعادة تعيين الأحداث الرياضية للافتراضي
        async function resetToDefault() {
            if (!isAdminMode()) {
                showNotification('هذه الميزة متاحة للمشرفين فقط', 'error');
                return;
            }

            const confirmText = 'إعادة تعيين';
            const userInput = prompt(`تحذير: هذا سيحذف جميع الأحداث الرياضية المخصصة ويعيدها للإعدادات الافتراضية.\n\nلتأكيد العملية، اكتب: ${confirmText}`);

            if (userInput !== confirmText) {
                showNotification('تم إلغاء العملية', 'info');
                return;
            }

            showNotification('جاري إعادة تعيين الأحداث الرياضية...', 'info');

            try {
                // إعادة تعيين الأحداث الرياضية فقط
                sportsEvents = [...defaultSportsEvents];

                // حفظ البيانات الافتراضية
                if (firebaseAvailable && database) {
                    try {
                        await database.ref('sportsEvents').set(sportsEvents);
                        console.log('تم حفظ الأحداث الافتراضية في Firebase');
                    } catch (firebaseError) {
                        console.error('خطأ في حفظ Firebase:', firebaseError);
                    }
                }

                // حفظ محلي
                localStorage.setItem('Nova_sportsEvents', JSON.stringify(sportsEvents));

                // تحديث العروض
                loadEventsList();
                updateSportsEventsDisplay();

                showNotification('تم إعادة تعيين الأحداث الرياضية بنجاح', 'success');
                console.log('تم إعادة تعيين الأحداث الرياضية للافتراضي');

            } catch (error) {
                console.error('خطأ في إعادة التعيين:', error);
                showNotification('فشل في إعادة التعيين: ' + error.message, 'error');
            }
        }

        // تحديث عرض فئات القنوات الرئيسية
        function updateChannelCategoriesDisplay() {
            const categoriesGrid = document.getElementById('channelCategoriesGrid');
            if (!categoriesGrid) {
                console.warn('عنصر categoriesGrid غير موجود');
                return;
            }

            console.log('تحديث عرض فئات القنوات:', Object.keys(channelData).length, 'فئة');

            let html = '';
            for (const categoryId in channelData) {
                const category = channelData[categoryId];
                if (!category) continue;

                const categoryImage = category.image || 'https://c.top4top.io/p_3499bjfz31.jpg';
                const channelCount = category.channels ? category.channels.length : 0;

                html += `
                    <div class="channel-category-card" onclick="showChannelSubPage('${categoryId}')">
                        <div style="width: 100%; height: 100px; border-radius: 10px; margin-bottom: 1rem; position: relative; overflow: hidden; background: url('${categoryImage}') center/cover;">
                            <div style="position: absolute; bottom: 10px; left: 10px; z-index: 2; color: white;">
                            </div>
                        </div>
                        <div class="channel-category-name">${category.title}</div>
                        <div class="channel-category-desc">الرقم الأساسي: ${category.baseNumber}</div>
                        <div class="channel-category-badge">
                            <i class="fas fa-video" style="font-size: 1.1rem;"></i>
                            <span>${channelCount} قناة</span>
                        </div>
                    </div>
                `;
            }

            categoriesGrid.innerHTML = html;
            console.log('تم تحديث عرض الفئات بنجاح');

            // إضافة تحديث للبحث إذا كان نشطاً
            const searchInput = document.getElementById('mainChannelSearchInput');
            if (searchInput && searchInput.value.trim()) {
                filterMainChannels();
            }
        }

        

        // ===== وظائف لوحة التحكم المحسنة =====

        // تحميل بيانات لوحة التحكم
        async function loadAdminData() {
            try {
                loadEventsList();
                showNotification('تم تحميل بيانات لوحة التحكم', 'success');
            } catch (error) {
                console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
                showNotification('خطأ في تحميل بيانات لوحة التحكم', 'error');
            }
        }

        // تبديل التبويبات في لوحة التحكم
        function switchAdminTab(tabName) {
            // إخفاء جميع التبويبات
            document.querySelectorAll('.admin-tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });

            // إزالة الحالة النشطة من جميع الأزرار
            document.querySelectorAll('.admin-tab').forEach(btn => {
                btn.classList.remove('active');
            });

            // إظهار التبويب المحدد
            const targetTab = document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`);
            if (targetTab) {
                targetTab.classList.remove('hidden');
            }

            // تفعيل الزر المحدد
            const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }

            // تحميل البيانات حسب التبويب
            switch(tabName) {
                case 'events':
                    loadEventsList();
                    break;
                case 'channels':
                    loadCategoriesList();
                    loadChannelCategorySelects();
                    break;
            }
        }

        // تحميل قائمة الأحداث
        function loadEventsList() {
            const eventsList = document.getElementById('eventsList');
            if (!eventsList) return;

            if (sportsEvents.length === 0) {
                eventsList.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-futbol" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <h3>لا توجد أحداث رياضية</h3>
                        <p>ابدأ بإضافة حدث رياضي جديد</p>
                    </div>
                `;
                return;
            }

            eventsList.innerHTML = sportsEvents.map((event, index) => {
                const statusIcon = event.status === 'live' ? 'fas fa-circle text-danger' : 
                                 event.status === 'finished' ? 'fas fa-check-circle text-success' : 
                                 'fas fa-clock text-warning';
                const statusText = event.status === 'live' ? 'مباشر' : 
                                 event.status === 'finished' ? 'انتهى' : 'قادم';
                const statusColor = event.status === 'live' ? '#ff4757' : 
                                  event.status === 'finished' ? '#2ed573' : '#ffa502';

                return `
                    <div class="category-item" style="align-items: flex-start;">
                        <div style="display: flex; gap: 1rem; align-items: flex-start; flex: 1;">
                            <div style="width: 80px; height: 60px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: var(--border-primary);">
                                <img src="${event.image}" alt="${event.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">
                            </div>
                            <div class="item-info" style="flex: 1;">
                                <div class="item-title">${event.title}</div>
                                <div class="item-subtitle">${event.subtitle}</div>
                                <div style="margin-top: 0.5rem;">
                                    <span style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; background: rgba(${statusColor === '#ff4757' ? '255, 71, 87' : statusColor === '#2ed573' ? '46, 213, 115' : '255, 165, 2'}, 0.1); color: ${statusColor}; border: 1px solid rgba(${statusColor === '#ff4757' ? '255, 71, 87' : statusColor === '#2ed573' ? '46, 213, 115' : '255, 165, 2'}, 0.3);">
                                        <i class="${statusIcon}" style="font-size: 0.7rem;"></i>
                                        ${statusText}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="item-actions">
                            <button class="action-btn" onclick="editEvent(${index})" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteEvent(${index})" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // وظيفة توليد معرف فريد
        function generateUniqueId() {
            return Date.now().toString(36) + Math.random().toString(36).substring(2);
        }

        // إضافة حدث رياضي جديد مع تحسينات
        async function addNewEvent() {
            const title = document.getElementById('newEventTitle')?.value.trim();
            const subtitle = document.getElementById('newEventSubtitle')?.value.trim();
            const image = document.getElementById('newEventImage')?.value.trim();
            const link = document.getElementById('newEventLink')?.value.trim();
            const status = document.getElementById('newEventStatus')?.value;

            // التحقق من صحة البيانات
            if (!title || !subtitle || !link || !status) {
                showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }

            // التحقق من صحة الرابط
            if (!link.startsWith('go:') && !link.startsWith('http')) {
                showNotification('الرابط يجب أن يبدأ بـ go: أو http', 'error');
                return;
            }

            // التحقق من عدم تكرار الحدث
            const eventExists = sportsEvents.some(event => 
                event.title === title && event.subtitle === subtitle
            );

            if (eventExists) {
                showNotification('حدث بنفس العنوان والوصف موجود بالفعل', 'error');
                return;
            }

            showNotification('جاري إضافة الحدث...', 'info');

            try {
                const newEvent = {
                    id: generateUniqueId(),
                    title: title,
                    subtitle: subtitle,
                    image: image || null,
                    link: link,
                    status: status,
                    timestamp: Date.now(),
                    category: 'general',
                    permanent: false,
                    lastModified: Date.now()
                };

                console.log('محاولة إضافة حدث رياضي جديد:', newEvent);

                // إضافة الحدث للمصفوفة
                sportsEvents.push(newEvent);

                // حفظ البيانات مع معالجة محسنة للأخطاء
                const saved = await saveSportsEvents();

                if (saved) {
                    // تنظيف النموذج
                    clearAddEventForm();

                    // تحديث العروض
                    loadEventsList();
                    updateSportsEventsDisplay();

                    console.log('تم إضافة الحدث بنجاح:', title);
                    showNotification('تم إضافة الحدث بنجاح وحفظه بشكل آمن', 'success');
                } else {
                    // إزالة الحدث إذا فشل الحفظ
                    sportsEvents.pop();
                    showNotification('فشل في حفظ الحدث - يرجى المحاولة مرة أخرى', 'error');
                }

            } catch (error) {
                console.error('خطأ في إضافة الحدث:', error);
                // إزالة الحدث إذا حدث خطأ
                if (sportsEvents.length > 0 && sportsEvents[sportsEvents.length - 1].title === title) {
                    sportsEvents.pop();
                }
                showNotification('فشل في إضافة الحدث: ' + error.message, 'error');
            }
        }

        // تنظيف نموذج إضافة الحدث
        function clearAddEventForm() {
            const fields = ['newEventTitle', 'newEventSubtitle', 'newEventImage', 'newEventLink'];
            fields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) field.value = '';
            });

            const statusField = document.getElementById('newEventStatus');
            if (statusField) statusField.value = 'upcoming';

            const preview = document.getElementById('newEventImagePreview');
            if (preview) preview.style.display = 'none';
        }

        // تعديل حدث رياضي
        function editEvent(eventIndex) {
            const event = sportsEvents[eventIndex];
            if (!event) {
                showNotification('الحدث غير موجود', 'error');
                return;
            }

            // ملء نموذج التعديل
            document.getElementById('editEventIndex').value = eventIndex;
            document.getElementById('editEventTitle').value = event.title;
            document.getElementById('editEventSubtitle').value = event.subtitle;
            document.getElementById('editEventImage').value = event.image || '';
            document.getElementById('editEventLink').value = event.link;
            document.getElementById('editEventStatus').value = event.status;

            // إظهار معاينة الصورة إذا وجدت
            if (event.image) {
                const preview = document.getElementById('editEventImagePreview');
                const img = document.getElementById('editEventImagePreviewImg');
                if (preview && img) {
                    img.src = event.image;
                    preview.style.display = 'block';
                }
            }

            // إظهار النموذج
            document.getElementById('editEventModal').style.display = 'flex';
        }

        // إغلاق نموذج تعديل الحدث
        function closeEditEventModal() {
            document.getElementById('editEventModal').style.display = 'none';
        }

        // حفظ تغييرات الحدث
        async function saveEventChanges() {
            const eventIndex = parseInt(document.getElementById('editEventIndex')?.value);
            const title = document.getElementById('editEventTitle')?.value.trim();
            const subtitle = document.getElementById('editEventSubtitle')?.value.trim();
            const image = document.getElementById('editEventImage')?.value.trim();
            const link = document.getElementById('editEventLink')?.value.trim();
            const status = document.getElementById('editEventStatus')?.value;

            if (isNaN(eventIndex) || !title || !subtitle || !link || !status) {
                showNotification('بيانات غير صحيحة', 'error');
                return;
            }

            try {
                if (!sportsEvents[eventIndex]) {
                    showNotification('الحدث غير موجود', 'error');
                    return;
                }

                // احفظ البيانات القديمة للتراجع في حالة الخطأ
                const oldEventData = { ...sportsEvents[eventIndex] };

                // تحديث الحدث مع الاحتفاظ بالمعلومات الأساسية
                sportsEvents[eventIndex] = {
                    ...sportsEvents[eventIndex], // الاحتفاظ بالـ ID والبيانات الأساسية
                    title: title,
                    subtitle: subtitle,
                    image: image || null,
                    link: link,
                    status: status,
                    lastModified: Date.now()
                };

                const saved = await saveSportsEvents();

                if (saved) {
                    closeEditEventModal();
                    loadEventsList();
                    updateSportsEventsDisplay();
                    showNotification('تم تحديث الحدث بنجاح', 'success');
                } else {
                    // استعادة البيانات القديمة في حالة فشل الحفظ
                    sportsEvents[eventIndex] = oldEventData;
                    showNotification('فشل في حفظ التغييرات', 'error');
                }

            } catch (error) {
                console.error('خطأ في تحديث الحدث:', error);
                showNotification('فشل في تحديث الحدث: ' + error.message, 'error');
            }
        }

        // حذف حدث رياضي
        async function deleteEvent(eventIndex) {
            const event = sportsEvents[eventIndex];
            if (!event) {
                showNotification('الحدث غير موجود', 'error');
                return;
            }

            // منع حذف الأحداث الدائمة
            if (event.permanent) {
                showNotification('لا يمكن حذف الأحداث الافتراضية', 'error');
                return;
            }

            if (!confirm(`هل أنت متأكد من حذف الحدث "${event.title}"؟`)) {
                return;
            }

            try {
                // احفظ الحدث المحذوف للتراجع
                const deletedEvent = { ...event };
                const deletedIndex = eventIndex;

                // حذف الحدث
                sportsEvents.splice(eventIndex, 1);

                const saved = await saveSportsEvents();

                if (saved) {
                    loadEventsList();
                    updateSportsEventsDisplay();
                    showNotification('تم حذف الحدث بنجاح', 'success');
                } else {
                    // استعادة الحدث المحذوف في حالة فشل الحفظ
                    sportsEvents.splice(deletedIndex, 0, deletedEvent);
                    showNotification('فشل في حذف الحدث', 'error');
                }

            } catch (error) {
                console.error('خطأ في حذف الحدث:', error);
                showNotification('فشل في حذف الحدث: ' + error.message, 'error');
            }
        }

        // توليد رقم تلقائي للأحداث
        function generateEventNumber() {
            const input = document.getElementById('newEventLink');
            if (!input) return;

            // Find the highest existing event number
            let maxNumber = 500; // Start from 500
            sportsEvents.forEach(event => {
                if (event.link && event.link.startsWith('go:')) {
                    const number = parseInt(event.link.replace('go:', ''));
                    if (!isNaN(number) && number > maxNumber) {
                        maxNumber = number;
                    }
                }
            });

            // Set next available number
            input.value = `go:${maxNumber + 1}`;
            showNotification(`تم توليد الرقم التلقائي: ${maxNumber + 1}`, 'success');
        }

        function generateEditEventNumber() {
            const input = document.getElementById('editEventLink');
            if (!input) return;

            // Find the highest existing event number
            let maxNumber = 500; // Start from 500
            sportsEvents.forEach(event => {
                if (event.link && event.link.startsWith('go:')) {
                    const number = parseInt(event.link.replace('go:', ''));
                    if (!isNaN(number) && number > maxNumber) {
                        maxNumber = number;
                    }
                }
            });

            // Set next available number
            input.value = `go:${maxNumber + 1}`;
            showNotification(`تم توليد الرقم التلقائي: ${maxNumber + 1}`, 'success');
        }

        // Simplified TV Remote Controller
        class TVRemoteController {
            constructor() {
                this.focusableElements = [];
                this.currentFocusIndex = -1;
                this.isAndroidTV = this.detectAndroidTV();
                this.init();
            }

            detectAndroidTV() {
                const ua = navigator.userAgent.toLowerCase();
                return ua.includes('android') && ua.includes('tv') || 
                       (window.screen.width >= 1280 && !('ontouchstart' in window));
            }

            init() {
                console.log('تهيئة نظام التحكم بالريموت لـ Android TV');
                
                // إضافة كلاسات خاصة بـ Android TV
                if (this.isAndroidTV) {
                    document.body.classList.add('android-tv', 'tv-optimized');
                    this.enableRemoteMode();
                }
                
                // إعداد مراقبة الأحداث
                document.addEventListener('keydown', this.handleKeyDown.bind(this));
                document.addEventListener('click', this.handleClick.bind(this));
                document.addEventListener('touchstart', this.handleTouch.bind(this));
                document.addEventListener('mousemove', this.handleMouseMove.bind(this));
                
                // إعداد مراقبة تغييرات DOM
                this.setupMutationObserver();
                
                // تحديث العناصر القابلة للتركيز
                setTimeout(() => {
                    this.updateFocusableElements();
                }, 500);
                
                // إضافة مؤشر التنقل للتلفاز
                this.addTVNavigationHint();
            }

            addTVNavigationHint() {
                if (this.isAndroidTV) {
                    const hint = document.createElement('div');
                    hint.className = 'tv-navigation-hint';
                    hint.innerHTML = `
                        <i class="fas fa-gamepad"></i>
                        استخدم الأسهم للتنقل • Enter للاختيار • Back للرجوع
                    `;
                    document.body.appendChild(hint);
                }
            }

            setupMutationObserver() {
                const observer = new MutationObserver((mutations) => {
                    // تجاهل التغييرات الطفيفة
                    const significantChange = mutations.some(mutation => 
                        mutation.type === 'childList' && 
                        (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) ||
                        (mutation.type === 'attributes' && 
                         ['class', 'style'].includes(mutation.attributeName) &&
                         mutation.target.classList.contains('section'))
                    );

                    if (!significantChange) return;

                    clearTimeout(this.updateTimeout);
                    this.updateTimeout = setTimeout(() => {
                        if (!this.isUpdating) {
                            this.throttledUpdate();
                        }
                    }, 300); // تأخير أطول
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'style']
                });
            }

            // تحديث محدود بالوقت
            throttledUpdate() {
                const now = Date.now();
                if (now - this.lastUpdateTime < this.updateThrottle) {
                    return; // تجاهل إذا كان التحديث حديثاً جداً
                }

                this.lastUpdateTime = now;
                this.updateFocusableElements();
            }

            updateFocusableElements() {
                if (this.isUpdating) return; // منع التداخل
                this.isUpdating = true;

                try {
                    // العناصر القابلة للتركيز - مبسطة للسرعة
                    const selectors = [
                        'button:not([disabled]):not(.hidden)',
                        'a[href]:not(.hidden)',
                        '.card:not(.hidden)',
                        '.channel-item:not(.hidden)',
                        '.channel-category-card:not(.hidden)',
                        '.nav-btn:not(.hidden)',
                        '.welcome-channels-btn:not(.hidden)'
                    ];

                    const newElements = [];

                    selectors.forEach(selector => {
                        try {
                            const elements = document.querySelectorAll(selector);
                            elements.forEach(element => {
                                try {
                                    const computedStyle = window.getComputedStyle(element);
                                    const isVisible = computedStyle.display !== 'none' && 
                                                    computedStyle.visibility !== 'hidden' && 
                                                    computedStyle.opacity !== '0' &&
                                                    element.offsetParent !== null;

                                    if (isVisible && this.isElementInViewport(element)) {
                                        newElements.push(element);
                                        this.makeFocusable(element);
                                    }
                                } catch (e) {
                                    // تجاهل العنصر في حالة حدوث خطأ
                                }
                            });
                        } catch (e) {
                            // تجاهل المحدد في حالة حدوث خطأ
                        }
                    });

                    // تحديث العناصر فقط إذا كان هناك تغيير كبير
                    if (Math.abs(newElements.length - this.focusableElements.length) > 1) {
                        this.focusableElements = newElements;

                        // ترتيب العناصر حسب الموقع
                        this.focusableElements.sort((a, b) => {
                            try {
                                const rectA = a.getBoundingClientRect();
                                const rectB = b.getBoundingClientRect();

                                if (Math.abs(rectA.top - rectB.top) > 50) {
                                    return rectA.top - rectB.top; // ترتيب عمودي
                                }
                                return rectA.left - rectB.left; // ترتيب أفقي
                            } catch (e) {
                                return 0;
                            }
                        });

                        // طباعة الرسالة فقط عند التغيير الكبير
                        console.log(`تم تحديث العناصر: ${this.focusableElements.length} عنصر قابل للتركيز`);
                    }

                } catch (error) {
                    console.warn('خطأ في تحديث العناصر القابلة للتركيز:', error);
                } finally {
                    this.isUpdating = false;
                }
            }

            isElementInViewport(element) {
                const rect = element.getBoundingClientRect();
                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 200 &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
            }

            makeFocusable(element) {
                if (!element.hasAttribute('tabindex') && element.tagName !== 'INPUT' && element.tagName !== 'SELECT') {
                    element.setAttribute('tabindex', '0');
                }
                element.classList.add('focusable');
            }

            setInitialFocus() {
                if (this.focusableElements.length > 0 && this.currentFocusIndex === -1) {
                    this.currentFocusIndex = 0;
                    if (this.isRemoteMode) {
                        this.focusElement(this.focusableElements[0]);
                    }
                }
            }

            handleKeyDown(event) {
                // اكتشاف استخدام الريموت مع أزرار Android TV الإضافية
                const remoteKeys = [
                    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
                    'Enter', 'Space', 'Escape', 'Backspace',
                    'MediaPlayPause', 'MediaStop', 'MediaTrackNext', 'MediaTrackPrevious',
                    'ContextMenu', 'Home', 'End', 'PageUp', 'PageDown'
                ];
                
                if (remoteKeys.includes(event.key) || event.key.startsWith('Media')) {
                    this.enableRemoteMode();
                }

                if (!this.isRemoteMode && !this.isAndroidTV) return;

                // تحديث العناصر إذا لزم الأمر
                if (this.focusableElements.length === 0) {
                    this.updateFocusableElements();
                }

                // معالجة الأزرار
                switch (event.key) {
                    case 'ArrowDown':
                        event.preventDefault();
                        this.moveVertically(1);
                        this.showTVHint('↓ التحرك لأسفل');
                        break;
                    case 'ArrowUp':
                        event.preventDefault();
                        this.moveVertically(-1);
                        this.showTVHint('↑ التحرك لأعلى');
                        break;
                    case 'ArrowRight':
                        event.preventDefault();
                        this.moveHorizontally(1);
                        this.showTVHint('→ التحرك يميناً');
                        break;
                    case 'ArrowLeft':
                        event.preventDefault();
                        this.moveHorizontally(-1);
                        this.showTVHint('← التحرك يساراً');
                        break;
                    case 'Enter':
                    case ' ':
                        event.preventDefault();
                        this.activateCurrentElement();
                        this.showTVHint('✓ تم الاختيار');
                        break;
                    case 'Escape':
                    case 'Backspace':
                        event.preventDefault();
                        this.handleEscape();
                        this.showTVHint('← العودة');
                        break;
                    case 'Home':
                        event.preventDefault();
                        showSection('live');
                        this.showTVHint('🏠 الصفحة الرئيسية');
                        break;
                    case 'ContextMenu':
                        event.preventDefault();
                        toggleSidebar();
                        this.showTVHint('☰ فتح القائمة');
                        break;
                    case 'PageUp':
                        event.preventDefault();
                        window.scrollBy(0, -window.innerHeight / 2);
                        this.showTVHint('⇈ تمرير لأعلى');
                        break;
                    case 'PageDown':
                        event.preventDefault();
                        window.scrollBy(0, window.innerHeight / 2);
                        this.showTVHint('⇊ تمرير لأسفل');
                        break;
                    // أزرار الوسائط
                    case 'MediaPlayPause':
                        event.preventDefault();
                        this.showTVHint('⏯️ تشغيل/إيقاف');
                        break;
                    case 'MediaStop':
                        event.preventDefault();
                        this.showTVHint('⏹️ إيقاف');
                        break;
                    // أرقام الريموت للانتقال المباشر
                    case '0':
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                    case '8':
                    case '9':
                        event.preventDefault();
                        this.handleNumberKey(event.key);
                        break;
                }
                
                this.lastInputTime = Date.now();
            }

            showTVHint(message) {
                if (!this.isAndroidTV) return;
                
                const hint = document.querySelector('.tv-navigation-hint');
                if (hint) {
                    hint.innerHTML = `<i class="fas fa-gamepad"></i> ${message}`;
                    hint.style.display = 'block';
                    
                    clearTimeout(this.hintTimeout);
                    this.hintTimeout = setTimeout(() => {
                        hint.innerHTML = `
                            <i class="fas fa-gamepad"></i>
                            استخدم الأسهم للتنقل • Enter للاختيار • Back للرجوع
                        `;
                    }, 2000);
                }
            }

            handleNumberKey(number) {
                const sections = ['live', 'channels', 'settings'];
                const sectionIndex = parseInt(number) - 1;
                
                if (sectionIndex >= 0 && sectionIndex < sections.length) {
                    showSection(sections[sectionIndex]);
                    this.showTVHint(`${number} - ${this.getSectionName(sections[sectionIndex])}`);
                } else if (number === '0') {
                    toggleSidebar();
                    this.showTVHint('0 - القائمة');
                }
            }

            getSectionName(section) {
                const names = {
                    'live': 'الرئيسية',
                    'channels': 'القنوات',
                    'settings': 'الإعدادات',
                    'admin': 'لوحة التحكم'
                };
                return names[section] || section;
            }

            moveVertically(direction) {
                if (this.focusableElements.length === 0) return;

                const currentElement = this.focusableElements[this.currentFocusIndex];
                if (!currentElement) {
                    this.currentFocusIndex = 0;
                    this.focusElement(this.focusableElements[0]);
                    return;
                }

                const currentRect = currentElement.getBoundingClientRect();
                let bestMatch = null;
                let bestDistance = Infinity;

                this.focusableElements.forEach((element, index) => {
                    if (index === this.currentFocusIndex) return;

                    const rect = element.getBoundingClientRect();
                    const verticalDistance = (rect.top - currentRect.top) * direction;
                    const horizontalDistance = Math.abs(rect.left - currentRect.left);

                    if (verticalDistance > 20) { // التحرك في الاتجاه الصحيح
                        const totalDistance = verticalDistance + (horizontalDistance * 0.3);
                        if (totalDistance < bestDistance) {
                            bestDistance = totalDistance;
                            bestMatch = index;
                        }
                    }
                });

                if (bestMatch !== null) {
                    this.currentFocusIndex = bestMatch;
                } else {
                    // الانتقال للطرف الآخر
                    this.currentFocusIndex = direction > 0 ? 0 : this.focusableElements.length - 1;
                }

                this.focusElement(this.focusableElements[this.currentFocusIndex]);
            }

            moveHorizontally(direction) {
                if (this.focusableElements.length === 0) return;

                const currentElement = this.focusableElements[this.currentFocusIndex];
                if (!currentElement) {
                    this.currentFocusIndex = 0;
                    this.focusElement(this.focusableElements[0]);
                    return;
                }

                const currentRect = currentElement.getBoundingClientRect();
                let bestMatch = null;
                let bestDistance = Infinity;

                this.focusableElements.forEach((element, index) => {
                    if (index === this.currentFocusIndex) return;

                    const rect = element.getBoundingClientRect();
                    const horizontalDistance = (rect.left - currentRect.left) * direction;
                    const verticalDistance = Math.abs(rect.top - currentRect.top);

                    if (horizontalDistance > 10) { // التحرك في الاتجاه الصحيح
                        const totalDistance = horizontalDistance + (verticalDistance * 0.5);
                        if (totalDistance < bestDistance) {
                            bestDistance = totalDistance;
                            bestMatch = index;
                        }
                    }
                });

                if (bestMatch !== null) {
                    this.currentFocusIndex = bestMatch;
                } else {
                    // البحث في نفس الصف
                    this.moveInSameRow(direction, currentRect);
                }

                this.focusElement(this.focusableElements[this.currentFocusIndex]);
            }

            moveInSameRow(direction, currentRect) {
                const sameRowElements = this.focusableElements.filter((element, index) => {
                    if (index === this.currentFocusIndex) return false;
                    const rect = element.getBoundingClientRect();
                    return Math.abs(rect.top - currentRect.top) < 50;
                });

                if (sameRowElements.length > 0) {
                    const sortedElements = sameRowElements.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
                    const targetElement = direction > 0 ? sortedElements[0] : sortedElements[sortedElements.length - 1];
                    this.currentFocusIndex = this.focusableElements.indexOf(targetElement);
                }
            }

            focusElement(element) {
                if (!element) return;

                // إزالة التركيز من جميع العناصر
                this.focusableElements.forEach(el => {
                    el.classList.remove('tv-focused');
                    el.blur();
                });

                // إضافة التركيز للعنصر الحالي
                element.classList.add('tv-focused');
                element.focus();

                // التمرير للعنصر إذا كان خارج الشاشة
                this.scrollToElement(element);

                console.log('تركيز على:', element.className, element.textContent?.substring(0, 30));
            }

            scrollToElement(element) {
                const rect = element.getBoundingClientRect();
                const isInView = (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= window.innerHeight &&
                    rect.right <= window.innerWidth
                );

                if (!isInView) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    });
                }
            }

            activateCurrentElement() {
                const currentElement = this.focusableElements[this.currentFocusIndex];
                if (!currentElement) return;

                // محاكاة النقر
                const event = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });

                currentElement.dispatchEvent(event);
                console.log('تم تنشيط العنصر:', currentElement.className);

                // تحديث العناصر بعد التفاعل
                setTimeout(() => {
                    this.updateFocusableElements();
                }, 500);
            }

            handleEscape() {
                // التعامل مع زر الهروب - إغلاق النوافذ المنبثقة أو العودة
                const modals = document.querySelectorAll('[style*="display: flex"], [style*="display: block"]:not(.main-app)');
                const visibleModal = Array.from(modals).find(modal => {
                    const style = window.getComputedStyle(modal);
                    return style.display !== 'none' && modal.classList.contains('overlay', 'modal');
                });

                if (visibleModal) {
                    const closeBtn = visibleModal.querySelector('.close-btn, .profile-close, [onclick*="close"]');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                } else {
                    // العودة للقسم الرئيسي
                    showSection('live');
                }
            }

            enableRemoteMode() {
                if (!this.isRemoteMode) {
                    this.isRemoteMode = true;
                    document.body.classList.add('remote-mode');
                    console.log('تم تفعيل وضع التحكم بالريموت');

                    this.updateFocusableElements();
                    this.setInitialFocus();
                }
                this.lastInputTime = Date.now();
            }

            handleClick(event) {
                // إيقاف وضع الريموت عند النقر بالماوس
                this.lastInputTime = Date.now();
                setTimeout(() => {
                    if (Date.now() - this.lastInputTime > this.remoteDetectionDelay) {
                        this.disableRemoteMode();
                    }
                }, this.remoteDetectionDelay);
            }

            handleTouch() {
                // إيقاف وضع الريموت عند اللمس
                this.disableRemoteMode();
            }

            handleMouseMove() {
                // إيقاف وضع الريموت عند حركة الماوس
                this.lastInputTime = Date.now();
                setTimeout(() => {
                    if (Date.now() - this.lastInputTime > this.remoteDetectionDelay) {
                        this.disableRemoteMode();
                    }
                }, this.remoteDetectionDelay);
            }

            disableRemoteMode() {
                if (this.isRemoteMode) {
                    this.isRemoteMode = false;
                    document.body.classList.remove('remote-mode');

                    // إزالة التركيز من جميع العناصر
                    this.focusableElements.forEach(el => {
                        el.classList.remove('tv-focused');
                        el.blur();
                    });

                    console.log('تم إيقاف وضع التحكم بالريموت');
                }
            }

            // إعادة تحديث العناصر عند تغيير القسم مع منع التذبذب
            onSectionChange() {
                // إيقاف التحديثات المؤقتة
                clearTimeout(this.updateTimeout);

                // تأخير أطول للسماح للقسم الجديد بالتحميل الكامل
                setTimeout(() => {
                    if (!this.isUpdating) {
                        this.updateFocusableElements();
                        this.setInitialFocus();
                    }
                }, 800); // تأخير أطول
            }
        }

        // إنشاء نسخة من التحكم بالريموت
        const tvRemote = new TVRemoteController();

        // ربط التحكم بالريموت مع تغيير الأقسام
        const originalShowSection = window.showSection;
        window.showSection = function(section) {
            originalShowSection(section);
            tvRemote.onSectionChange();
        };

        // Start the app
        startApp();



        // Firebase connection status
        let firebaseStatus = {
            connected: false,
            lastCheck: null
        };

        // Monitor Firebase connection
        async function monitorFirebaseConnection() {
            if (firebaseAvailable && database) {
                try {
                    const snapshot = await database.ref('.info/connected').once('value');
                    const connected = snapshot.val();

                    if (connected) {
                        if (!firebaseStatus.connected) {
                            firebaseStatus.connected = true;
                            console.log('اتصال Firebase نشط');
                        }
                    } else {
                        if (firebaseStatus.connected) {
                            firebaseStatus.connected = false;
                            console.warn('انقطع اتصال Firebase');
                        }
                    }
                } catch (error) {
                    if (firebaseStatus.connected) {
                        firebaseStatus.connected = false;
                        console.warn('انقطع اتصال Firebase:', error);
                    }
                }
            }

            firebaseStatus.lastCheck = new Date();
        }

        // Check Firebase connection periodically
        setInterval(monitorFirebaseConnection, 30000); // كل 30 ثانية

        // Initialize App - محسن للسرعة
        window.addEventListener('DOMContentLoaded', () => {
            try {
                // إخفاء شاشة التحميل بسرعة أكبر
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) {
                    loadingOverlay.style.opacity = '0';
                    setTimeout(() => {
                        loadingOverlay.style.display = 'none';
                        if (!checkSavedLogin()) {
                            const loginPage = document.getElementById('loginPage');
                            if (loginPage) {
                                loginPage.classList.remove('hidden');
                            }
                        }
                    }, 100);
                }

                // تهيئة سريعة للعناصر الأساسية
                applyThemeColor();
                initializeSettings();
                
                // تأجيل Firebase إلى ما بعد ظهور الواجهة
                setTimeout(() => {
                    monitorFirebaseConnection();
                }, 100);
                
                // تأجيل تهيئة الهيدر للحصول على أداء أفضل
                requestAnimationFrame(() => {
                    initializeHeaderScroll();
                });
                
            } catch (error) {
                console.error('Critical error during app load:', error);
                // إخفاء شاشة التحميل حتى مع الأخطاء
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
            }
        });

        // Header Scroll Animation (Simplified)
        function initializeHeaderScroll() {
            let lastScrollTop = 0;
            let isScrolling = false;
            let hideTimeout;
            const header = document.querySelector('.header');
            const mainContent = document.querySelector('.main-content');

            if (!header) return;

            window.addEventListener('scroll', function() {
                if (!isScrolling) {
                    window.requestAnimationFrame(function() {
                        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                        const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
                        const scrollSpeed = Math.abs(scrollTop - lastScrollTop);

                        // Clear any existing timeout
                        clearTimeout(hideTimeout);

                        // إخفاء الهيدر عند السحب للأسفل بسرعة
                        if (scrollDirection === 'down' && scrollTop > 100 && scrollSpeed > 5) {
                            header.classList.add('header-hidden');
                            if (mainContent) mainContent.classList.add('header-hidden');
                        } else if (scrollDirection === 'up' || scrollTop <= 60) {
                            header.classList.remove('header-hidden');
                            if (mainContent) mainContent.classList.remove('header-hidden');
                        }

                        // إظهار الهيدر عند التوقف عن السحب
                        hideTimeout = setTimeout(() => {
                            if (scrollTop > 100) {
                                header.classList.remove('header-hidden');
                                if (mainContent) mainContent.classList.remove('header-hidden');
                            }
                        }, 2000);

                        // إضافة تأثير الخلفية عند السحب
                        if (scrollTop > 30) {
                            header.classList.add('header-scrolled');
                        } else {
                            header.classList.remove('header-scrolled');
                        }

                        lastScrollTop = scrollTop;
                        isScrolling = false;
                    });
                }
                isScrolling = true;
            }, { passive: true });

            // إظهار الهيدر عند hover في الجزء العلوي
            document.addEventListener('mousemove', function(e) {
                if (e.clientY < 60 && header.classList.contains('header-hidden')) {
                    header.classList.remove('header-hidden');
                    if (mainContent) mainContent.classList.remove('header-hidden');
                }
            });
        }



        // Initialize Settings
        function initializeSettings() {


            // Notifications switch
            const notificationsSwitch = document.getElementById('notificationsSwitch');
            if (notificationsSwitch) {
                notificationsSwitch.addEventListener('change', function() {
                    const previousSetting = settings.notifications;
                    settings.notifications = this.checked;
                    localStorage.setItem('Nova_settings', JSON.stringify(settings));

                    // إظهار إشعار واحد فقط لتأكيد التغيير (مع تجاوز إعدادات الإشعارات مؤقتاً)
                    const tempNotifications = settings.notifications;
                    settings.notifications = true; // تفعيل مؤقت لإظهار رسالة التأكيد
                    showNotification(this.checked ? 'تم تفعيل الإشعارات' : 'تم إلغاء الإشعارات', 'success');

                    // إعادة الإعداد للحالة الصحيحة
                    setTimeout(() => {
                        settings.notifications = tempNotifications;
                    }, 100);
                });
                notificationsSwitch.checked = settings.notifications;
            }

            // Data saver switch
            const dataSaverSwitch = document.getElementById('dataSaverSwitch');
            if (dataSaverSwitch) {
                dataSaverSwitch.addEventListener('change', function() {
                    settings.dataSaver = this.checked;
                    localStorage.setItem('Nova_settings', JSON.stringify(settings));
                    showNotification(this.checked ? 'الميزة لا تعمل حاليا' : 'الميزة لا تعمل حاليا', 'erorr');
                });
                dataSaverSwitch.checked = settings.dataSaver || false;
            }


        }





        // Login Functions
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('usernameInput').value.trim();
            const password = document.getElementById('passwordInput').value;

            // Check if admin login
            if (username === ADMIN_USERNAME) {
                if (password === ADMIN_PASSWORD) {
                    login(username, true);
                } else {
                    showNotification('كلمة مرور الأدمن غير صحيحة', 'error');
                    return;
                }
            } else {
                login(username || 'ضيف', false);
            }
        });

        // Show password field when admin username is entered
        document.getElementById('usernameInput').addEventListener('input', function() {
            const passwordGroup = document.getElementById('passwordGroup');
            const passwordInput = document.getElementById('passwordInput');

            if (this.value.trim() === ADMIN_USERNAME) {
                passwordGroup.style.display = 'block';
                passwordInput.required = true;
            } else {
                passwordGroup.style.display = 'none';
                passwordInput.required = false;
                passwordInput.value = '';
            }
        });

        function login(username, adminStatus = false) {
            showNotification('جاري تسجيل الدخول...', 'success');
            setTimeout(() => {
                currentUser = username;
                isAdmin = adminStatus;
                const loginData = {
                    username: username,
                    isAdmin: adminStatus,
                    loginTime: new Date().getTime(),
                    isLoggedIn: true
                };
                localStorage.setItem('Nova_user', JSON.stringify(loginData));
                updateUserDisplay(username);
                updateAdminUI();
                document.getElementById('loginPage').classList.add('hidden');
                document.getElementById('mainApp').classList.remove('hidden');

                if (adminStatus) {
                    showNotification(`مرحباً أدمن ${username}! تم تفعيل صلاحيات الإدارة`, 'success');
                } else {
                    showNotification(`مرحباً ${username}!`, 'success');
                }
            }, 800);
        }

        function enterAsGuest() {
            login('ضيف');
        }

        function checkSavedLogin() {
            const savedUser = localStorage.getItem('Nova_user');
            if (savedUser) {
                try {
                    const loginData = JSON.parse(savedUser);
                    const currentTime = new Date().getTime();
                    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

                    if (loginData.isLoggedIn && (currentTime - loginData.loginTime) < thirtyDays) {
                        currentUser = loginData.username;
                        isAdmin = loginData.isAdmin || false;
                        updateUserDisplay(loginData.username);
                        updateAdminUI();
                        document.getElementById('loginPage').classList.add('hidden');
                        document.getElementById('mainApp').classList.remove('hidden');
                        return true;
                    } else {
                        localStorage.removeItem('Nova_user');
                    }
                } catch (e) {
                    localStorage.removeItem('Nova_user');
                }
            }
            return false;
        }

        function logout() {
            // إيقاف المراقبة في الوقت الفعلي
            disableRealtimeSync();

            // Clear all user data
            localStorage.removeItem('Nova_user');

            // Reset variables
            currentUser = null;
            isAdmin = false;

            // Reset UI
            document.getElementById('loginPage').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');

            // Clear input fields
            const usernameInput = document.getElementById('usernameInput');
            const passwordInput = document.getElementById('passwordInput');
            const passwordGroup = document.getElementById('passwordGroup');

            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';
            if (passwordGroup) {
                passwordGroup.style.display = 'none';
                passwordInput.required = false;
            }

            // Update displays
            updateUserDisplay('ضيف');
            updateAdminUI();

            showNotification('تم تسجيل الخروج بنجاح', 'success');
        }

        // Admin UI Functions
        function updateAdminUI() {
            const adminMenuItem = document.getElementById('adminMenuItem');
            if (adminMenuItem) {
                adminMenuItem.style.display = isAdmin ? 'block' : 'none';
            }
        }

        // Navigation Functions
        async function showSection(section) {
            // Check admin access for admin section
            if (section === 'admin' && !isAdmin) {
                showNotification('ليس لديك صلاحية للوصول إلى لوحة التحكم', 'error');
                return;
            }

            // إيقاف تحديثات الريموت مؤقتاً أثناء التبديل
            if (tvRemote) {
                tvRemote.isUpdating = true;
                clearTimeout(tvRemote.updateTimeout);
            }

            // استخدام requestAnimationFrame لتحسين الأداء
            requestAnimationFrame(() => {
                // إخفاء جميع الأقسام
                document.querySelectorAll('.section').forEach(sec => {
                    sec.classList.add('hidden');
                });

                // إظهار القسم المحدد
                const targetSection = document.getElementById(section + 'Section');
                if (targetSection) {
                    targetSection.classList.remove('hidden');
                }

                // إعادة تعيين صفحة القنوات إلى الحالة الافتراضية
                if (section === 'channels') {
                    const categoriesMain = document.getElementById('channelCategoriesMain');
                    const subPage = document.getElementById('channelSubPage');
                    if (categoriesMain) categoriesMain.style.display = 'block';
                    if (subPage) subPage.style.display = 'none';
                }

                closeSidebar();

                // إعادة تشغيل تحديثات الريموت بعد انتهاء التبديل
                if (tvRemote) {
                    setTimeout(() => {
                        tvRemote.isUpdating = false;
                        tvRemote.onSectionChange();
                    }, 100);
                }
            });
        }

        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.toggle('active');
            }
        }

        function closeSidebar() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }



        // Theme Color Functions
        function changeThemeColor(color) {
            currentThemeColor = color;
            localStorage.setItem('Nova_color', color);
            applyThemeColor();

            // Update active color indicator
            document.querySelectorAll('.color-option').forEach(theme => {
                theme.classList.remove('selected');
            });
            const selectedTheme = document.querySelector(`.color-option[data-color="${color}"]`);
            if (selectedTheme) {
                selectedTheme.classList.add('selected');
            }

            showNotification(`تم تغيير اللون إلى ${getColorName(color)}`, 'success');
        }

        function applyThemeColor() {
            try {
                // Apply theme class to document
                const currentClasses = document.documentElement.className.split(' ');
                const filteredClasses = currentClasses.filter(cls => !cls.startsWith('theme-'));
                document.documentElement.className = filteredClasses.concat([`theme-${currentThemeColor}`]).join(' ');

                // Update active color indicator with delay to ensure DOM is ready
                setTimeout(() => {
                    try {
                        const colorOptions = document.querySelectorAll('.color-option');
                        colorOptions.forEach(theme => {
                            if (theme && theme.classList) {
                                theme.classList.remove('selected');
                            }
                        });

                        const activeTheme = document.querySelector(`.color-option[data-color="${currentThemeColor}"]`);
                        if (activeTheme && activeTheme.classList) {
                            activeTheme.classList.add('selected');
                        }
                    } catch (innerError) {
                        console.warn('Error updating color indicators:', innerError);
                    }
                }, 100);
            } catch (error) {
                console.warn('Error applying theme color:', error);
            }
        }

        function getColorName(color) {
            const colorNames = {
                'red': 'الأحمر',
                'blue': 'الأزرق',
                'green': 'الأخضر',
                'purple': 'البنفسجي',
                'orange': 'البرتقالي',
                'pink': 'الوردي',
                'cyan': 'السماوي',
                'yellow': 'الأصفر',
                'indigo': 'النيلي',
                'emerald': 'الزمردي',
                'teal': 'الفيروزي',
                'rose': 'الوردي الداكن',
                'violet': 'البنفسجي الفاتح',
                'amber': 'العنبري',
                'lime': 'الليموني',
                'sky': 'السماوي الفاتح',
                'fuchsia': 'الفوشيا',
                'slate': 'الرمادي الداكن'
            };
            return colorNames[color] || color;
        }

        // Settings Functions
        function toggleDaznSetting(element) {
            element.classList.toggle('active');

            // Save settings
            const settingItem = element.closest('.dazn-setting-item');
            if (settingItem) {
                const settingTitle = settingItem.querySelector('.dazn-setting-title');
                if (settingTitle) {
                    const settingName = settingTitle.textContent.trim();
                    settings[settingName] = element.classList.contains('active');
                    localStorage.setItem('Nova_settings', JSON.stringify(settings));
                }
            }

            showNotification('تم حفظ الإعداد', 'success');
        }

        function toggleSetting(element) {
            toggleDaznSetting(element);
        }





        // Get channel logo function
        function getChannelLogo(channelName, categoryId) {
            // beIN Sports channels
            if (channelName.includes('beIN Sports')) {
                if (channelName.includes('News')) return '<img src="https://e.top4top.io/p_3506no4v61.jpg" alt="Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                return '<img src="https://d.top4top.io/p_3495cezyj1.jpg" alt="beIN" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
            }

            // Sports General channels
            if (categoryId === 'c-alwanhd') {
                if (channelName.includes('Alwan 1 HD')) return '<img src="https://c.top4top.io/p_35061ypdb1.jpg" alt="alwan" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                if (channelName.includes('Alwan 2 HD')) return '<img src="https://d.top4top.io/p_3506bds121.jpg" alt="alwan" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                if (channelName.includes('Alwan 3 HD')) return '<img src="https://f.top4top.io/p_3506g56rs1.jpg" alt="alwan" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                if (channelName.includes('Alwan 4 HD')) return '<img src="https://e.top4top.io/p_3506jml4i1.jpg" alt="alwan" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';       
                if (channelName.includes('Alwan 5 HD')) return '<img src="https://g.top4top.io/p_3506jg7f11.jpg" alt="alwan" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                if (channelName.includes('Alwan 6 HD')) return '<img src="https://h.top4top.io/p_3506uyx4x1.jpg" alt="alwna" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';         
                return '<img src="https://j.top4top.io/p_3497y0uz51.jpg" alt="Sports" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
            }

            // FaJER channels
            if (categoryId === 'fjr-s') {
                if (channelName.includes('FaJER 1 HD')) return '<img src="https://i.ibb.co/0cY46br/AL-FAJER-1.jpg" alt="alwan" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                if (channelName.includes('FaJER 2 HD')) return '<img src="https://i.ibb.co/P4CR80X/AL-FAJER-2.jpg" alt="alwan" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                if (channelName.includes('FaJER 3 HD')) return '<img src="https://i.ibb.co/yXf7bTT/AL-FAJER-3.jpg" alt="alwan" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                if (channelName.includes('FaJER 4 HD')) return '<img src="https://i.ibb.co/sFfdsqc/AL-FAJER-4.jpg" alt="alwan" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';       
                if (channelName.includes('FaJER 5 HD')) return '<img src="https://i.ibb.co/W6VV956/AL-FAJER-5.jpg" alt="alwan" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                return '<img src="https://j.top4top.io/p_3497y0uz51.jpg" alt="Sports" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
            }

            // Sports General channels
            if (categoryId === 'sports-general') {
                if (channelName.includes('NRT')) return '<img src="https://f.top4top.io/p_35068pcjx1.jpg" alt="NRT" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                if (channelName.includes('AVA')) return '<img src="https://g.top4top.io/p_3506dl9kx1.jpg" alt="AVA" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                if (channelName.includes('LD')) return '<img src="https://e.top4top.io/p_3506b73rk1.jpg" alt="LD" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                if (channelName.includes('ASTERA')) return '<img src="https://d.top4top.io/p_3506rgu7i1.jpg" alt="ASTERA" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';       
                if (channelName.includes('DUHOK')) return '<img src="https://c.top4top.io/p_35062fdhw1.jpg" alt="DUHOK" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                if (channelName.includes('DAISYNA')) return '<img src="https://d.top4top.io/p_3410wcw3d1.jpg" alt="DAISYNA" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';         
                return '<img src="https://j.top4top.io/p_3497y0uz51.jpg" alt="Sports" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
            }

                       // Thmanyah channels
            if (categoryId === 'cc-thmanyah') {
                if (channelName.includes('Thmanyah')) return '<img src="https://i.top4top.io/p_3513fvawe1.jpg" alt="alwan" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
                return '<img src="https://j.top4top.io/p_3497y0uz51.jpg" alt="Sports" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
            }

            // Default channel logo
            return '<img src="https://i.imgur.com/6y7JuWP.png" alt="Channel" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">';
        }

        // Channel Functions
        function showChannelSubPage(categoryId) {
            try {
                const data = channelData[categoryId];
                if (!data) {
                    console.error('Channel data not found for category:', categoryId);
                    showNotification('خطأ في تحميل بيانات القنوات', 'error');
                    return;
                }

                // Hide main search results
                const mainSearchResults = document.getElementById('mainSearchResults');
                if (mainSearchResults) {
                    mainSearchResults.style.display = 'none';
                }

                // Clear main search if active
                const mainSearchInput = document.getElementById('mainChannelSearchInput');
                if (mainSearchInput && mainSearchInput.value) {
                    mainSearchInput.value = '';
                    const mainSearchClearBtn = document.getElementById('mainSearchClearBtn');
                    if (mainSearchClearBtn) {
                        mainSearchClearBtn.style.display = 'none';
                    }
                    // Show categories grid again
                    const categoriesGrid = document.querySelector('.channel-categories-grid');
                    if (categoriesGrid) {
                        categoriesGrid.style.display = 'grid';
                    }
                }

                const categoriesMain = document.getElementById('channelCategoriesMain');
                const subPage = document.getElementById('channelSubPage');
                const subTitle = document.getElementById('channelSubTitle');
                const grid = document.getElementById('channelSubGrid');

                if (!categoriesMain || !subPage || !subTitle || !grid) {
                    console.error('Required channel page elements not found');
                    showNotification('خطأ في عناصر الصفحة', 'error');
                    return;
                }

                // Show sub page
                categoriesMain.style.display = 'none';
                subPage.style.display = 'block';
                subTitle.textContent = data.title;

                // Clear previous content
                grid.innerHTML = '';

                // Generate channel items
                const channelItems = data.channels.map((channel, index) => {
                    try {
                        const channelName = typeof channel === 'string' ? channel : channel.name;
                        const quality = channelName.includes('HD') ? 'HD' : channelName.includes('SD') ? 'SD' : 'LIVE';
                        const channelNumber = data.baseNumber + index;
                        const channelLogo = getChannelLogo(channelName, categoryId);

                        return `
                            <div class="channel-item-wrapper">
                                <a href="go:${channelNumber}" class="channel-item" target="_blank" rel="noopener noreferrer">
                                    <div class="channel-status"></div>
                                    <div class="channel-logo">
                                        ${channelLogo}
                                    </div>
                                    <div class="channel-info">
                                        <div class="channel-name">${channelName}</div>
                                        <div class="channel-quality">${quality}</div>
                                    </div>
                                </a>
                            </div>
                        `;
                    } catch (itemError) {
                        console.warn('Error creating channel item:', itemError);
                        return '';
                    }
                }).filter(item => item !== '');

                // Insert content with simple animation
                grid.innerHTML = channelItems.join('');
                
                // Add simple slide-down animation
                if (subPage) {
                    subPage.style.opacity = '0';
                    subPage.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        subPage.style.transition = 'all 0.2s ease-out';
                        subPage.style.opacity = '1';
                        subPage.style.transform = 'translateY(0)';
                    }, 10);
                }

            } catch (error) {
                console.error('Error in showChannelSubPage:', error);
                showNotification('حدث خطأ في تحميل القنوات', 'error');
            }
        }

        function backToChannelCategories() {
            try {
                const channelCategoriesMain = document.getElementById('channelCategoriesMain');
                const channelSubPage = document.getElementById('channelSubPage');

                if (channelCategoriesMain) {
                    channelCategoriesMain.style.display = 'block';
                }

                if (channelSubPage) {
                    channelSubPage.style.display = 'none';
                    // إعادة تعيين الأنيميشن
                    channelSubPage.style.transition = '';
                    channelSubPage.style.opacity = '';
                    channelSubPage.style.transform = '';
                }

            } catch (error) {
                console.error('Error in backToChannelCategories:', error);
                showNotification('خطأ في الرجوع للفئات', 'error');
            }
        }





        // Simple Notification System
        let notificationCounter = 0;

        function showNotification(message, type = 'success', duration = 3000) {
            // التحقق من إعدادات الإشعارات
            if (!settings.notifications && type !== 'error') {
                return;
            }

            notificationCounter++;
            const notificationId = `notification-${notificationCounter}`;

            // Get icon based on type
            let iconClass = 'fas fa-info-circle';
            if (type === 'success') iconClass = 'fas fa-check-circle';
            else if (type === 'error') iconClass = 'fas fa-exclamation-triangle';

            // Create notification element
            const notification = document.createElement('div');
            notification.id = notificationId;
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <div class="notification-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="notification-text">${message}</div>
                <button class="notification-close" onclick="removeNotification('${notificationId}')">
                    <i class="fas fa-times"></i>
                </button>
            `;

            // Add to container
            const container = document.getElementById('notificationContainer');
            if (container) {
                container.appendChild(notification);

                // Show immediately
                notification.classList.add('show');

                // Auto remove after duration
                setTimeout(() => {
                    removeNotification(notificationId);
                }, duration);
            }
        }

        function showPremiumMessage() {
            showNotification('قريباً!', 'info');
        }

        function removeNotification(notificationId) {
            const notification = document.getElementById(notificationId);
            if (notification) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-50px)';

                setTimeout(() => {
                    if (notification && notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 100);
            }
        }



        // تبسيط إدارة بيانات المستخدم
        function updateUserDisplay(username) {
            try {
                // Update user avatar with first letter
                const userName = document.getElementById('userName');
                if (userName) {
                    const firstLetter = username ? username.charAt(0).toUpperCase() : 'ض';
                    userName.textContent = firstLetter;
                }
            } catch (error) {
                console.warn('Error updating user display:', error);
            }
        }

        // ===== IMAGE PREVIEW FUNCTIONS =====
        function showImagePreview(imageUrl, previewId, imgId) {
            try {
                const preview = document.getElementById(previewId);
                const img = document.getElementById(imgId);
                
                if (preview && img && imageUrl && imageUrl.trim()) {
                    img.src = imageUrl.trim();
                    preview.style.display = 'block';
                    
                    // إضافة معالج للأخطاء
                    img.onerror = function() {
                        hideImagePreview(previewId);
                    };
                } else {
                    hideImagePreview(previewId);
                }
            } catch (error) {
                console.warn('خطأ في عرض معاينة الصورة:', error);
                hideImagePreview(previewId);
            }
        }

        function hideImagePreview(previewId) {
            try {
                const preview = document.getElementById(previewId);
                if (preview) {
                    preview.style.display = 'none';
                    
                    // مسح src الصورة
                    const img = preview.querySelector('img');
                    if (img) {
                        img.src = '';
                    }
                }
            } catch (error) {
                console.warn('خطأ في إخفاء معاينة الصورة:', error);
            }
        }

        // معاينة الصور في نماذج الإدخال
        function previewNewEventImage() {
            const imageUrl = document.getElementById('newEventImage')?.value.trim();
            if (imageUrl) {
                showImagePreview(imageUrl, 'newEventImagePreview', 'newEventImagePreviewImg');
            } else {
                hideImagePreview('newEventImagePreview');
            }
        }

        function previewEditEventImage() {
            const imageUrl = document.getElementById('editEventImage')?.value.trim();
            if (imageUrl) {
                showImagePreview(imageUrl, 'editEventImagePreview', 'editEventImagePreviewImg');
            } else {
                hideImagePreview('editEventImagePreview');
            }
        }

        

        // Initialize default section
        document.addEventListener('DOMContentLoaded', function() {
            // تحميل البيانات مع ضمان العرض
            Promise.all([
                loadChannelData(),
                loadSportsEvents()
            ]).then(() => {
                // ضمان تحديث العرض بعد تحميل البيانات
                updateSportsEventsDisplay();
                console.log('تم تحميل جميع البيانات وتحديث العرض');
            }).catch(error => {
                console.error('خطأ في تحميل البيانات:', error);
                // في حالة الخطأ، استخدم البيانات الافتراضية
                sportsEvents = [...defaultSportsEvents];
                updateSportsEventsDisplay();
            });

            showSection('live');
            initializeMatchesSlider();



            // Initialize admin panel
            loadAdminData();

            // تحديث العرض مرة أخرى للتأكد
            setTimeout(() => {
                updateSportsEventsDisplay();
            }, 500);


        });

        // ===== CATEGORIES MANAGEMENT FUNCTIONS =====

        // تحميل قائمة الفئات
        function loadCategoriesList() {
            const categoriesList = document.getElementById('categoriesList');
            if (!categoriesList) return;

            if (!channelData || Object.keys(channelData).length === 0) {
                categoriesList.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-tv" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <h3>لا توجد فئات قنوات</h3>
                        <p>ابدأ بإضافة فئة قنوات جديدة</p>
                    </div>
                `;
                return;
            }

            categoriesList.innerHTML = Object.entries(channelData).map(([categoryId, category]) => {
                const channelCount = category.channels ? category.channels.length : 0;
                
                return `
                    <div class="category-item" style="align-items: flex-start;">
                        <div style="display: flex; gap: 1rem; align-items: flex-start; flex: 1;">
                            <div style="width: 80px; height: 60px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: var(--border-primary);">
                                <img src="${category.image || 'https://c.top4top.io/p_3499bjfz31.jpg'}" alt="${category.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">
                            </div>
                            <div class="item-info" style="flex: 1;">
                                <div class="item-title">${category.title}</div>
                                <div class="item-subtitle">المعرف: ${categoryId} | الرقم الأساسي: ${category.baseNumber}</div>
                                <div style="margin-top: 0.5rem;">
                                    <span style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; background: rgba(var(--accent-primary), 0.1); color: var(--accent-primary); border: 1px solid rgba(var(--accent-primary), 0.3);">
                                        <i class="fas fa-video" style="font-size: 0.7rem;"></i>
                                        ${channelCount} قناة
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="item-actions">
                            <button class="action-btn" onclick="editCategory('${categoryId}')" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteCategory('${categoryId}')" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // تحميل قوائم اختيار الفئات
        function loadChannelCategorySelects() {
            const selects = ['channelCategorySelect'];
            
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (!select) return;

                const currentValue = select.value;
                select.innerHTML = '<option value="">اختر فئة القنوات...</option>';

                Object.entries(channelData).forEach(([categoryId, category]) => {
                    const option = document.createElement('option');
                    option.value = categoryId;
                    option.textContent = category.title;
                    select.appendChild(option);
                });

                if (currentValue && channelData[currentValue]) {
                    select.value = currentValue;
                }
            });
        }

        // إضافة فئة جديدة
        async function addNewCategory() {
            try {
                // التحقق من وجود العناصر أولاً
                const titleElement = document.getElementById('newCategoryTitle');
                const categoryIdElement = document.getElementById('newCategoryId');
                const baseNumberElement = document.getElementById('newCategoryBaseNumber');
                const imageElement = document.getElementById('newCategoryImage');

                if (!titleElement || !categoryIdElement || !baseNumberElement) {
                    showNotification('خطأ: عناصر النموذج غير موجودة', 'error');
                    console.error('عناصر النموذج المفقودة:', {
                        title: !!titleElement,
                        categoryId: !!categoryIdElement,
                        baseNumber: !!baseNumberElement,
                        image: !!imageElement
                    });
                    return;
                }

                const title = titleElement.value?.trim();
                const categoryId = categoryIdElement.value?.trim();
                const baseNumberValue = baseNumberElement.value?.trim();
                const image = imageElement ? imageElement.value?.trim() : '';

                // التحقق من صحة القيم
                if (!title || !categoryId || !baseNumberValue) {
                    showNotification('يرجى ملء جميع الحقول المطلوبة (العنوان، المعرف، الرقم الأساسي)', 'error');
                    return;
                }

                const baseNumber = parseInt(baseNumberValue);
                if (isNaN(baseNumber) || baseNumber <= 0) {
                    showNotification('يرجى إدخال رقم أساسي صحيح', 'error');
                    return;
                }

                // التحقق من صحة معرف الفئة
                if (!/^[a-zA-Z0-9-_]+$/.test(categoryId)) {
                    showNotification('معرف الفئة يجب أن يحتوي على أحرف وأرقام وشرطات فقط', 'error');
                    return;
                }

                // التحقق من عدم وجود معرف مكرر
                if (channelData && channelData[categoryId]) {
                    showNotification('معرف الفئة موجود بالفعل، يرجى اختيار معرف آخر', 'error');
                    return;
                }

                // التحقق من عدم تكرار الرقم الأساسي
                if (channelData) {
                    const existingBaseNumbers = Object.values(channelData).map(cat => cat.baseNumber).filter(num => !isNaN(num));
                    if (existingBaseNumbers.includes(baseNumber)) {
                        showNotification('الرقم الأساسي موجود بالفعل، يرجى اختيار رقم آخر', 'error');
                        return;
                    }
                }

                showNotification('جاري إضافة الفئة...', 'info');

                const newCategory = {
                    title: title,
                    baseNumber: baseNumber,
                    image: image || 'https://c.top4top.io/p_3499bjfz31.jpg',
                    channels: []
                };

                // إضافة الفئة الجديدة
                if (!channelData) {
                    channelData = {};
                }
                channelData[categoryId] = newCategory;

                // محاولة الحفظ
                const saved = await saveChannelData();

                if (saved) {
                    // تنظيف النموذج
                    clearAddCategoryForm();

                    // تحديث العروض
                    loadCategoriesList();
                    loadChannelCategorySelects();
                    updateChannelCategoriesDisplay();

                    showNotification('تم إضافة الفئة بنجاح', 'success');
                    console.log('تم إضافة فئة جديدة:', categoryId, newCategory);
                } else {
                    // إزالة الفئة إذا فشل الحفظ
                    delete channelData[categoryId];
                    showNotification('فشل في حفظ الفئة - يرجى المحاولة مرة أخرى', 'error');
                }

            } catch (error) {
                console.error('خطأ في إضافة الفئة:', error);
                showNotification('حدث خطأ غير متوقع: ' + (error.message || 'خطأ غير معروف'), 'error');

                // إزالة الفئة إذا تم إضافتها قبل حدوث الخطأ
                if (categoryId && channelData && channelData[categoryId]) {
                    delete channelData[categoryId];
                }
            }
        }

        // تنظيف نموذج إضافة الفئة
        function clearAddCategoryForm() {
            try {
                const fields = ['newCategoryTitle', 'newCategoryId', 'newCategoryBaseNumber', 'newCategoryImage'];
                fields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field && field.value !== undefined) {
                        field.value = '';
                    }
                });

                const preview = document.getElementById('newCategoryImagePreview');
                if (preview) {
                    preview.style.display = 'none';
                }

                console.log('تم تنظيف نموذج إضافة الفئة');
            } catch (error) {
                console.warn('خطأ في تنظيف النموذج:', error);
            }
        }

        // تعديل فئة
        function editCategory(categoryId) {
            const category = channelData[categoryId];
            if (!category) {
                showNotification('الفئة غير موجودة', 'error');
                return;
            }

            // ملء نموذج التعديل
            document.getElementById('editCategoryId').value = categoryId;
            document.getElementById('editCategoryTitle').value = category.title;
            document.getElementById('editCategoryBaseNumber').value = category.baseNumber;
            document.getElementById('editCategoryImage').value = category.image || '';

            // إظهار معاينة الصورة إذا وجدت
            if (category.image) {
                const preview = document.getElementById('editCategoryImagePreview');
                const img = document.getElementById('editCategoryImagePreviewImg');
                if (preview && img) {
                    img.src = category.image;
                    preview.style.display = 'block';
                }
            }

            // إظهار النموذج
            document.getElementById('editCategoryModal').style.display = 'flex';
        }

        // إغلاق نموذج تعديل الفئة
        function closeEditCategoryModal() {
            document.getElementById('editCategoryModal').style.display = 'none';
        }

        // حفظ تغييرات الفئة
        async function saveCategoryChanges() {
            const categoryId = document.getElementById('editCategoryId')?.value;
            const title = document.getElementById('editCategoryTitle')?.value.trim();
            const baseNumber = parseInt(document.getElementById('editCategoryBaseNumber')?.value);
            const image = document.getElementById('editCategoryImage')?.value.trim();

            if (!categoryId || !title || !baseNumber) {
                showNotification('بيانات غير صحيحة', 'error');
                return;
            }

            // التحقق من عدم تكرار الرقم الأساسي مع فئات أخرى
            const existingBaseNumbers = Object.entries(channelData)
                .filter(([id]) => id !== categoryId)
                .map(([, cat]) => cat.baseNumber);
            
            if (existingBaseNumbers.includes(baseNumber)) {
                showNotification('الرقم الأساسي موجود بالفعل في فئة أخرى', 'error');
                return;
            }

            try {
                if (!channelData[categoryId]) {
                    showNotification('الفئة غير موجودة', 'error');
                    return;
                }

                // تحديث الفئة
                channelData[categoryId] = {
                    ...channelData[categoryId],
                    title: title,
                    baseNumber: baseNumber,
                    image: image || channelData[categoryId].image
                };

                const saved = await saveChannelData();

                if (saved) {
                    closeEditCategoryModal();
                    loadCategoriesList();
                    loadChannelCategorySelects();
                    updateChannelCategoriesDisplay();
                    showNotification('تم تحديث الفئة بنجاح', 'success');
                } else {
                    showNotification('فشل في حفظ التغييرات', 'error');
                }

            } catch (error) {
                console.error('خطأ في تحديث الفئة:', error);
                showNotification('فشل في تحديث الفئة: ' + error.message, 'error');
            }
        }

        // حذف فئة
        async function deleteCategory(categoryId) {
            const category = channelData[categoryId];
            if (!category) {
                showNotification('الفئة غير موجودة', 'error');
                return;
            }

            if (!confirm(`هل أنت متأكد من حذف فئة "${category.title}"؟\nسيتم حذف جميع القنوات في هذه الفئة أيضاً.`)) {
                return;
            }

            try {
                // احفظ الفئة المحذوفة للتراجع
                const deletedCategory = { ...category };

                // حذف الفئة
                delete channelData[categoryId];

                const saved = await saveChannelData();

                if (saved) {
                    loadCategoriesList();
                    loadChannelCategorySelects();
                    updateChannelCategoriesDisplay();
                    
                    // مسح قائمة القنوات إذا كانت الفئة المحذوفة مختارة
                    const channelSelect = document.getElementById('channelCategorySelect');
                    if (channelSelect && channelSelect.value === categoryId) {
                        channelSelect.value = '';
                        document.getElementById('addChannelForm').style.display = 'none';
                        document.getElementById('channelsList').innerHTML = '';
                    }

                    showNotification('تم حذف الفئة بنجاح', 'success');
                } else {
                    // استعادة الفئة المحذوفة
                    channelData[categoryId] = deletedCategory;
                    showNotification('فشل في حذف الفئة', 'error');
                }

            } catch (error) {
                console.error('خطأ في حذف الفئة:', error);
                showNotification('فشل في حذف الفئة: ' + error.message, 'error');
            }
        }

        // ===== CHANNELS MANAGEMENT FUNCTIONS =====

        // تحميل القنوات لفئة محددة
        function loadChannelsForCategory() {
            const categorySelect = document.getElementById('channelCategorySelect');
            const addChannelForm = document.getElementById('addChannelForm');
            const channelsList = document.getElementById('channelsList');

            if (!categorySelect || !addChannelForm || !channelsList) return;

            const selectedCategoryId = categorySelect.value;

            if (!selectedCategoryId) {
                addChannelForm.style.display = 'none';
                channelsList.innerHTML = '';
                return;
            }

            const category = channelData[selectedCategoryId];
            if (!category) {
                addChannelForm.style.display = 'none';
                channelsList.innerHTML = '<p style="color: var(--text-muted);">الفئة غير موجودة</p>';
                return;
            }

            // إظهار نموذج إضافة القنوات
            addChannelForm.style.display = 'block';

            // عرض قائمة القنوات
            if (!category.channels || category.channels.length === 0) {
                channelsList.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-video" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <h3>لا توجد قنوات في هذه الفئة</h3>
                        <p>ابدأ بإضافة قناة جديدة</p>
                    </div>
                `;
                return;
            }

            channelsList.innerHTML = category.channels.map((channel, index) => {
                const channelName = typeof channel === 'string' ? channel : channel.name;
                const channelImage = (typeof channel === 'object' && channel.image) ? channel.image : null;
                const channelNumber = category.baseNumber + index;

                return `
                    <div class="category-item" style="align-items: center;">
                        <div style="display: flex; gap: 1rem; align-items: center; flex: 1;">
                            <div style="width: 60px; height: 45px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: var(--border-primary);">
                                ${channelImage ? 
                                    `<img src="${channelImage}" alt="${channelName}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">` :
                                    `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.8rem;">لا توجد صورة</div>`
                                }
                            </div>
                            <div class="item-info" style="flex: 1;">
                                <div class="item-title">${channelName}</div>
                                <div class="item-subtitle">الرقم: ${channelNumber}</div>
                            </div>
                        </div>
                        <div class="item-actions">
                            <button class="action-btn delete" onclick="deleteChannelFromCategory('${selectedCategoryId}', ${index})" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // إضافة قناة إلى فئة
        async function addChannelToCategory() {
            const categorySelect = document.getElementById('channelCategorySelect');
            const channelName = document.getElementById('newChannelName')?.value.trim();
            const channelImage = document.getElementById('newChannelImage')?.value.trim();

            if (!categorySelect || !channelName) {
                showNotification('يرجى ملء اسم القناة واختيار الفئة', 'error');
                return;
            }

            const categoryId = categorySelect.value;
            if (!categoryId) {
                showNotification('يرجى اختيار فئة القنوات', 'error');
                return;
            }

            const category = channelData[categoryId];
            if (!category) {
                showNotification('الفئة المحددة غير موجودة', 'error');
                return;
            }

            // التحقق من عدم تكرار اسم القناة
            const existingChannels = category.channels || [];
            const channelExists = existingChannels.some(channel => {
                const existingName = typeof channel === 'string' ? channel : channel.name;
                return existingName === channelName;
            });

            if (channelExists) {
                showNotification('اسم القناة موجود بالفعل في هذه الفئة', 'error');
                return;
            }

            showNotification('جاري إضافة القناة...', 'info');

            try {
                // إنشاء كائن القناة
                const newChannel = channelImage ? 
                    { name: channelName, image: channelImage } : 
                    channelName;

                // إضافة القناة للفئة
                if (!category.channels) {
                    category.channels = [];
                }
                category.channels.push(newChannel);

                const saved = await saveChannelData();

                if (saved) {
                    // تنظيف النموذج
                    document.getElementById('newChannelName').value = '';
                    document.getElementById('newChannelImage').value = '';
                    hideImagePreview('newChannelImagePreview');

                    // تحديث العروض
                    loadChannelsForCategory();
                    updateChannelCategoriesDisplay();

                    showNotification('تم إضافة القناة بنجاح', 'success');
                } else {
                    // إزالة القناة إذا فشل الحفظ
                    category.channels.pop();
                    showNotification('فشل في حفظ القناة', 'error');
                }

            } catch (error) {
                console.error('خطأ في إضافة القناة:', error);
                // إزالة القناة إذا حدث خطأ
                if (category.channels && category.channels.length > 0) {
                    const lastChannel = category.channels[category.channels.length - 1];
                    const lastName = typeof lastChannel === 'string' ? lastChannel : lastChannel.name;
                    if (lastName === channelName) {
                        category.channels.pop();
                    }
                }
                showNotification('فشل في إضافة القناة: ' + error.message, 'error');
            }
        }

        // حذف قناة من فئة
        async function deleteChannelFromCategory(categoryId, channelIndex) {
            const category = channelData[categoryId];
            if (!category || !category.channels || !category.channels[channelIndex]) {
                showNotification('القناة غير موجودة', 'error');
                return;
            }

            const channel = category.channels[channelIndex];
            const channelName = typeof channel === 'string' ? channel : channel.name;

            if (!confirm(`هل أنت متأكد من حذف قناة "${channelName}"؟`)) {
                return;
            }

            try {
                // احفظ القناة المحذوفة للتراجع
                const deletedChannel = { ...channel };

                // حذف القناة
                category.channels.splice(channelIndex, 1);

                const saved = await saveChannelData();

                if (saved) {
                    loadChannelsForCategory();
                    updateChannelCategoriesDisplay();
                    showNotification('تم حذف القناة بنجاح', 'success');
                } else {
                    // استعادة القناة المحذوفة
                    category.channels.splice(channelIndex, 0, deletedChannel);
                    showNotification('فشل في حذف القناة', 'error');
                }

            } catch (error) {
                console.error('خطأ في حذف القناة:', error);
                showNotification('فشل في حذف القناة: ' + error.message, 'error');
            }
        }

        // معاينة الصور للفئات والقنوات
        function previewNewCategoryImage() {
            const imageUrl = document.getElementById('newCategoryImage')?.value.trim();
            if (imageUrl) {
                showImagePreview(imageUrl, 'newCategoryImagePreview', 'newCategoryImagePreviewImg');
            } else {
                hideImagePreview('newCategoryImagePreview');
            }
        }

        function previewEditCategoryImage() {
            const imageUrl = document.getElementById('editCategoryImage')?.value.trim();
            if (imageUrl) {
                showImagePreview(imageUrl, 'editCategoryImagePreview', 'editCategoryImagePreviewImg');
            } else {
                hideImagePreview('editCategoryImagePreview');
            }
        }

        function previewNewChannelImage() {
            const imageUrl = document.getElementById('newChannelImage')?.value.trim();
            if (imageUrl) {
                showImagePreview(imageUrl, 'newChannelImagePreview', 'newChannelImagePreviewImg');
            } else {
                hideImagePreview('newChannelImagePreview');
            }
        }

        // ===== ADMIN PANEL FUNCTIONS =====

        async function switchAdminTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.admin-tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });

            // Remove active class from all tabs
            document.querySelectorAll('.admin-tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected tab content
            document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.remove('hidden');

            // Add active class to selected tab
            document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

            // Load specific data for the tab with error handling
            try {
                if (tabName === 'events') {
                    loadEventsList();
                }
            } catch (error) {
                console.error('خطأ في تحميل بيانات التبويب:', error);
                showNotification('خطأ في تحميل البيانات', 'error');
            }
        }

        async function loadAdminData() {
            // التأكد من وجود البيانات
            if (!channelData || Object.keys(channelData).length === 0) {
                console.log('تحميل بيانات القنوات الافتراضية...');
                channelData = JSON.parse(JSON.stringify(defaultChannelData));
                await saveChannelData();
            }

            if (!sportsEvents || sportsEvents.length === 0) {
                console.log('تحميل بيانات الأحداث الافتراضية...');
                sportsEvents = [...defaultSportsEvents];
                await saveSportsEvents();
            }

            // تحميل قوائم الإدارة
            loadEventsList();
            loadCategoriesList();
            loadChannelCategorySelects();
        }

        // ===== SPORTS EVENTS MANAGEMENT FUNCTIONS =====

        function loadEventsList() {
            const eventsList = document.getElementById('eventsList');
            if (!eventsList) return;

            if (sportsEvents.length === 0) {
                eventsList.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-futbol" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <h3>لا توجد أحداث رياضية</h3>
                        <p>ابدأ بإضافة حدث رياضي جديد</p>
                    </div>
                `;
                return;
            }

            eventsList.innerHTML = sportsEvents.map((event, index) => {
                const statusIcon = event.status === 'live' ? 'fas fa-circle text-danger' : 
                                 event.status === 'finished' ? 'fas fa-check-circle text-success' : 
                                 'fas fa-clock text-warning';
                const statusText = event.status === 'live' ? 'مباشر' : 
                                 event.status === 'finished' ? 'انتهى' : 'قادم';
                const statusColor = event.status === 'live' ? '#ff4757' : 
                                  event.status === 'finished' ? '#2ed573' : '#ffa502';

                return `
                    <div class="category-item" style="align-items: flex-start;">
                        <div style="display: flex; gap: 1rem; align-items: flex-start; flex: 1;">
                            <div style="width: 80px; height: 60px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: var(--border-primary);">
                                <img src="${event.image}" alt="${event.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">
                            </div>
                            <div class="item-info" style="flex: 1;">
                                <div class="item-title">${event.title}</div>
                                <div class="item-subtitle">${event.subtitle}</div>
                                <div style="margin-top: 0.5rem;">
                                    <span style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; background: rgba(${statusColor === '#ff4757' ? '255, 71, 87' : statusColor === '#2ed573' ? '46, 213, 115' : '255, 165, 2'}, 0.1); color: ${statusColor}; border: 1px solid rgba(${statusColor === '#ff4757' ? '255, 71, 87' : statusColor === '#2ed573' ? '46, 213, 115' : '255, 165, 2'}, 0.3);">
                                        <i class="${statusIcon}" style="font-size: 0.7rem;"></i>
                                        ${statusText}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="item-actions">
                            <button class="action-btn" onclick="editEvent(${index})" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteEvent(${index})" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        async function addNewEvent() {
            const title = document.getElementById('newEventTitle').value.trim();
            const subtitle = document.getElementById('newEventSubtitle').value.trim();
            const image = document.getElementById('newEventImage').value.trim();
            const link = document.getElementById('newEventLink').value.trim();
            const status = document.getElementById('newEventStatus').value;

            if (!title || !subtitle) {
                showNotification('يرجى ملء العنوان والوصف على الأقل', 'error');
                return;
            }

            const newEvent = {
                title: title,
                subtitle: subtitle,
                image: image || 'https://via.placeholder.com/400x250?text=حدث+رياضي',
                link: link || null,
                status: status
            };

            sportsEvents.push(newEvent);

            const saved = await saveSportsEvents();
            if (saved) {
                showNotification('تم إضافة الحدث بنجاح', 'success');

                // Clear inputs and preview
                document.getElementById('newEventTitle').value = '';
                document.getElementById('newEventSubtitle').value = '';
                document.getElementById('newEventImage').value = '';
                document.getElementById('newEventLink').value = '';
                document.getElementById('newEventStatus').value = 'upcoming';
                hideImagePreview('newEventImagePreview');

                // Refresh displays
                loadEventsList();
                updateSportsEventsDisplay();
            } else {
                showNotification('خطأ في حفظ البيانات', 'error');
            }
        }

        function editEvent(index) {
            const event = sportsEvents[index];
            if (!event) return;

            // Fill edit form
            document.getElementById('editEventIndex').value = index;
            document.getElementById('editEventTitle').value = event.title;
            document.getElementById('editEventSubtitle').value = event.subtitle;
            document.getElementById('editEventImage').value = event.image;
            document.getElementById('editEventLink').value = event.link || '';
            document.getElementById('editEventStatus').value = event.status;

            // Show image preview if available
            if (event.image) {
                showImagePreview(event.image, 'editEventImagePreview', 'editEventImagePreviewImg');
            } else {
                hideImagePreview('editEventImagePreview');
            }

            // Show modal
            const modal = document.getElementById('editEventModal');
            modal.style.display = 'flex';
        }

        function closeEditEventModal() {
            const modal = document.getElementById('editEventModal');
            modal.style.display = 'none';
        }

        async function saveEventChanges() {
            const index = parseInt(document.getElementById('editEventIndex').value);
            const title = document.getElementById('editEventTitle').value.trim();
            const subtitle = document.getElementById('editEventSubtitle').value.trim();
            const image = document.getElementById('editEventImage').value.trim();
            const link = document.getElementById('editEventLink').value.trim();
            const status = document.getElementById('editEventStatus').value;

            if (!title || !subtitle) {
                showNotification('يرجى ملء العنوان والوصف على الأقل', 'error');
                return;
            }

            sportsEvents[index] = {
                title: title,
                subtitle: subtitle,
                image: image || sportsEvents[index].image,
                link: link || null,
                status: status
            };

            if (await saveSportsEvents()) {
                showNotification('تم حفظ التغييرات بنجاح', 'success');
                closeEditEventModal();
                loadEventsList();
                updateSportsEventsDisplay();
            } else {
                showNotification('خطأ في حفظ البيانات', 'error');
            }
        }

        async function deleteEvent(index) {
            const event = sportsEvents[index];
            if (!event) return;

            if (!confirm(`هل أنت متأكد من حذف الحدث "${event.title}"؟`)) {
                return;
            }

            sportsEvents.splice(index, 1);

            if (await saveSportsEvents()) {
                showNotification('تم حذف الحدث بنجاح', 'success');
                loadEventsList();
                updateSportsEventsDisplay();
            } else {
                showNotification('خطأ في حفظ البيانات', 'error');
            }
        }

        // تحديث عرض الأحداث الرياضية
        function updateSportsEventsDisplay() {
            const slider = document.getElementById('bestOfFootballSlider');
            if (!slider) {
                console.warn('عنصر bestOfFootballSlider غير موجود');
                return;
            }

            let html = '';
            const eventsToShow = sportsEvents.length > 0 ? sportsEvents : defaultSportsEvents;

            eventsToShow.forEach((event, index) => {
                const eventImage = event.image || 'https://c.top4top.io/p_3499bjfz31.jpg';
                const eventLink = event.link || '#';

                // تحديد نص وكلاس الحالة
                let statusText = '';
                let statusClass = '';

                switch(event.status) {
                    case 'live':
                        statusText = 'مباشر';
                        statusClass = 'live';
                        break;
                    case 'upcoming':
                        statusText = 'قادم';
                        statusClass = 'upcoming';
                        break;
                    case 'finished':
                        statusText = 'انتهى';
                        statusClass = 'finished';
                        break;
                    default:
                        statusText = 'قادم';
                        statusClass = 'upcoming';
                }

                // استخراج رقم القناة من الرابط
                let channelNumber = null;
                if (eventLink && eventLink.startsWith('go:')) {
                    channelNumber = eventLink.replace('go:', '');
                }

                const clickHandler = channelNumber ? 
                    `onclick="handleChannelClick(event, ${channelNumber})"` : 
                    `onclick="showNotification('رابط غير متاح', 'info')"`;

                html += `
                    <div class="football-event-card" ${clickHandler} style="cursor: pointer;">
                        <div class="card-background" style="background-image: url('${eventImage}'); background-size: cover; background-position: center;"></div>

                        <!-- شارة الحالة المحسنة -->
                        <div class="event-status-badge ${statusClass}">
                            ${statusText}
                        </div>

                        <div class="football-info">
                            <div class="football-title">${event.title || 'حدث رياضي'}</div>
                            <div class="football-subtitle">${event.subtitle || 'وصف الحدث'}</div>
                        </div>
                    </div>
                `;
            });

            slider.innerHTML = html;
            console.log(`تم عرض ${eventsToShow.length} حدث رياضي`);
        }

        // Generate automatic numbers for events
        function generateEventNumber() {
            const linkInput = document.getElementById('newEventLink');
            if (!linkInput) return;

            // Find the highest existing event number
            let maxNumber = 500; // Start from 500
            sportsEvents.forEach(event => {
                if (event.link && event.link.startsWith('go:')) {
                    const number = parseInt(event.link.replace('go:', ''));
                    if (!isNaN(number) && number > maxNumber) {
                        maxNumber = number;
                    }
                }
            });

            // Set next available number
            linkInput.value = `go:${maxNumber + 1}`;
            showNotification(`تم توليد الرقم التلقائي: ${maxNumber + 1}`, 'success');
        }

        function generateEditEventNumber() {
            const linkInput = document.getElementById('editEventLink');
            if (!linkInput) return;

            // Find the highest existing event number
            let maxNumber = 500; // Start from 500
            sportsEvents.forEach(event => {
                if (event.link && event.link.startsWith('go:')) {
                    const number = parseInt(event.link.replace('go:', ''));
                    if (!isNaN(number) && number > maxNumber) {
                        maxNumber = number;
                    }
                }
            });

            // Set next available number
            linkInput.value = `go:${maxNumber + 1}`;
            showNotification(`تم توليد الرقم التلقائي: ${maxNumber + 1}`, 'success');
        }

        

        function updateChannelCategoriesDisplay() {
            // Update the main channels page display
            const categoriesGrid = document.querySelector('.channel-categories-grid');
            if (!categoriesGrid) return;

            categoriesGrid.innerHTML = Object.keys(channelData).map(categoryId => {
                const category = channelData[categoryId];
                const channelCount = category.channels.length;

                // Determine background image based on category
                let bgImage = 'https://i.imgur.com/default.jpg';
                if (categoryId.includes('bein')) bgImage = 'https://c.top4top.io/p_3408jzbg31.jpg';
                else if (categoryId.includes('fjr') || categoryId.includes('fajer')) bgImage = 'https://h.top4top.io/p_3506bqcex1.jpg';
                else if (categoryId.includes('c-alwanhd')) bgImage = 'https://i.top4top.io/p_3506uo65h1.jpg';
                else if (categoryId.includes('cc-thmanyah')) bgImage = 'https://pbs.twimg.com/card_img/1953836002222473216/dziKdJqf?format=jpg&name=medium';                
                else if (categoryId.includes('sport')) bgImage = 'https://c.top4top.io/p_3499bjfz31.jpg';

                return `
                    <div class="channel-category-card" onclick="showChannelSubPage('${categoryId}')">
                        <div style="width: 100%; height: 100px; border-radius: 10px; margin-bottom: 1rem; position: relative; overflow: hidden; background: url('${bgImage}') center/cover;">
                            <div style="position: absolute; bottom: 10px; left: 10px; z-index: 2; color: white;">
                            </div>
                        </div>
                        <div class="channel-category-name">${category.title}</div>
                        <div class="channel-category-desc">${getCategoryDescription(categoryId)}</div>
                        <div class="channel-category-badge">
                            <i class="fas fa-video" style="font-size: 1.1rem;"></i>
                            <span>${channelCount} قناة</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function getCategoryDescription(categoryId) {
            const descriptions = {
                'bein-hd': 'مجموعة قنوات الباقة البنفسجية الرياضية',
                'fjr-s': 'القنوات الفلسطينية الرياضية جميع الأحداث',
                'sports-general': 'مجموعة متنوعة من القنوات الرياضية',
                'c-alwanhd': 'أفضل باقة رياضية لمشاهدة المباريات بأعلى جودة'
            };
            return descriptions[categoryId] || 'مجموعة قنوات ثمانية لبث مباريات الدوري السعودي';
        }



        async function resetToDefault() {
            if (!confirm('هل أنت متأكد من إعادة تعيين جميع البيانات للافتراضية؟\nسيتم فقدان جميع التغييرات التي أجريتها.')) {
                return;
            }

            try {
                channelData = JSON.parse(JSON.stringify(defaultChannelData)); // نسخ عميق
                sportsEvents = JSON.parse(JSON.stringify(defaultSportsEvents)); // نسخ عميق

                const channelSaved = await saveChannelData();
                const eventsSaved = await saveSportsEvents();

                if (channelSaved && eventsSaved) {
                    showNotification('تم إعادة تعيين البيانات للافتراضية بنجاح', 'success');
                    loadAdminData();
                    updateChannelCategoriesDisplay();
                    updateSportsEventsDisplay();
                } else {
                    showNotification('خطأ في حفظ البيانات المعاد تعيينها', 'error');
                }
            } catch (error) {
                console.error('خطأ في إعادة تعيين البيانات:', error);
                showNotification('حدث خطأ أثناء إعادة التعيين', 'error');
            }
        }

        // تهيئة سلايدر المباريات مع إمكانية السحب - محسن للسرعة
        function initializeMatchesSlider() {
            initializeSlider('matchesSlider');
            initializeSlider('bestOfFootballSlider');
        }

        function initializeSlider(sliderId) {
            const slider = document.getElementById(sliderId);
            if (!slider) return;

            let isDown = false;
            let startX;
            let scrollLeft;
            let isDragging = false;

            // Mouse events - محسن للأداء
            slider.addEventListener('mousedown', (e) => {
                isDown = true;
                slider.classList.add('dragging');
                startX = e.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
                isDragging = false;
                slider.style.scrollBehavior = 'auto'; // إزالة smooth أثناء السحب
            });

            slider.addEventListener('mouseleave', () => {
                isDown = false;
                slider.classList.remove('dragging');
                slider.style.scrollBehavior = 'smooth';
            });

            slider.addEventListener('mouseup', () => {
                isDown = false;
                slider.classList.remove('dragging');
                slider.style.scrollBehavior = 'smooth';

                // منع النقر إذا كان هناك سحب
                if (isDragging) {
                    setTimeout(() => {
                        isDragging = false;
                    }, 50); // تقليل الوقت
                }
            });

            slider.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                isDragging = true;
                const x = e.pageX - slider.offsetLeft;
                const walk = (x - startX) * 1.5; // تقليل المقاومة
                slider.scrollLeft = scrollLeft - walk;
            });

            // Touch events للهواتف المحمولة - محسن للسرعة
            let touchStartX = 0;
            let touchStartScrollLeft = 0;

            slider.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartScrollLeft = slider.scrollLeft;
                slider.classList.add('dragging');
                slider.style.scrollBehavior = 'auto';
            }, { passive: true });

            slider.addEventListener('touchmove', (e) => {
                if (!touchStartX) return;

                const touchX = e.touches[0].clientX;
                const diffX = touchStartX - touchX;
                slider.scrollLeft = touchStartScrollLeft + (diffX * 0.8); // تحسين استجابة اللمس
                isDragging = true;
            }, { passive: true });

            slider.addEventListener('touchend', () => {
                touchStartX = 0;
                slider.classList.remove('dragging');
                slider.style.scrollBehavior = 'smooth';

                // منع النقر إذا كان هناك سحب
                if (isDragging) {
                    setTimeout(() => {
                        isDragging = false;
                    }, 50); // تقليل الوقت
                }
            }, { passive: true });

            // منع النقر على الروابط أثناء السحب
            slider.addEventListener('click', (e) => {
                if (isDragging) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true);
        }

        // Search and Filter Functions for Main Categories Page
        function filterMainChannels() {
            const searchInput = document.getElementById('mainChannelSearchInput');
            const searchClearBtn = document.getElementById('mainSearchClearBtn');
            const searchValue = searchInput.value.trim();

            // Show/hide clear button
            searchClearBtn.style.display = searchValue ? 'block' : 'none';

            // Debounce search
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performMainSearch(searchValue);
            }, 300);
        }

        function performMainSearch(searchTerm) {
            const searchResults = document.getElementById('mainSearchResults');
            const searchResultsGrid = document.getElementById('mainSearchResultsGrid');
            const categoriesGrid = document.querySelector('.channel-categories-grid');

            if (!searchTerm) {
                searchResults.style.display = 'none';
                categoriesGrid.style.display = 'grid';
                return;
            }

            // Hide categories grid and show search results
            categoriesGrid.style.display = 'none';
            searchResults.style.display = 'block';

            // Search through all channels
            const results = [];
            for (const categoryId in channelData) {
                const category = channelData[categoryId];
                category.channels.forEach((channel, index) => {
                    const channelName = typeof channel === 'string' ? channel : channel.name;
                    if (channelName.toLowerCase().includes(searchTerm.toLowerCase())) {
                        results.push({
                            name: channelName,
                            category: category.title,
                            categoryId: categoryId,
                            index: index,
                            channelNumber: category.baseNumber + index
                        });
                    }
                });
            }

            displayMainSearchResults(results);
        }



        function displayMainSearchResults(results) {
            const searchResultsGrid = document.getElementById('mainSearchResultsGrid');

            if (results.length === 0) {
                searchResultsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <h3>لا توجد نتائج</h3>
                        <p>جرب البحث بكلمات مختلفة</p>
                    </div>
                `;
                return;
            }

            searchResultsGrid.innerHTML = results.map(result => {
                const quality = result.name.includes('HD') ? 'HD' : result.name.includes('SD') ? 'SD' : 'LIVE';
                const channelLogo = getChannelLogo(result.name, result.categoryId);

                return `
                    <a href="go:${result.channelNumber}" class="search-result-item lazy-load" target="_blank" rel="noopener noreferrer">
                        <div class="search-result-icon">
                            ${channelLogo}
                        </div>
                        <div class="search-result-info">
                            <div class="search-result-name">${result.name}</div>
                            <div class="search-result-category">${quality} • ${result.category}</div>
                        </div>
                    </a>
                `;
            }).join('');

            // Apply lazy loading animation
            setTimeout(() => {
                document.querySelectorAll('.search-result-item.lazy-load').forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('loaded');
                    }, index * 50);
                });
            }, 100);
        }

        function clearMainSearch() {
            const searchInput = document.getElementById('mainChannelSearchInput');
            const searchClearBtn = document.getElementById('mainSearchClearBtn');
            const searchResults = document.getElementById('mainSearchResults');
            const categoriesGrid = document.querySelector('.channel-categories-grid');

            searchInput.value = '';
            searchClearBtn.style.display = 'none';
            searchResults.style.display = 'none';
            categoriesGrid.style.display = 'grid';

            showNotification('تم مسح البحث', 'success');
        }

        // Performance Optimizations
        function optimizeImages() {
            // Lazy load images when they come into viewport
            const images = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // فحص حالة الحفظ ومعلومات النظام
        function checkSaveStatus() {
            const status = {
                firebase: firebaseAvailable && firebaseStatus.connected,
                localStorage: typeof Storage !== "undefined",
                lastSave: {
                    events: localStorage.getItem('Nova_sportsEvents_backup') ? 
                           JSON.parse(localStorage.getItem('Nova_sportsEvents_backup')).timestamp : null,
                    channels: localStorage.getItem('Nova_channelData_backup') ? 
                             JSON.parse(localStorage.getItem('Nova_channelData_backup')).timestamp : null
                },
                dataIntegrity: {
                    events: Array.isArray(sportsEvents) && sportsEvents.length > 0,
                    channels: channelData && typeof channelData === 'object' && Object.keys(channelData).length > 0
                }
            };
            
            console.log('حالة نظام الحفظ:', status);
            return status;
        }

        // معالج محسن لأخطاء الحفظ مع إعادة المحاولة الذكية
        async function handleSaveError(error, dataType, retryFunction) {
            console.error(`خطأ في حفظ ${dataType}:`, error);
            
            // محاولة إعادة الاتصال بـ Firebase إذا كان متاحاً
            if (firebaseAvailable && !firebaseStatus.connected) {
                try {
                    await reconnectToFirebase();
                    console.log('تم إعادة الاتصال، محاولة الحفظ مرة أخرى...');
                    return await retryFunction();
                } catch (reconnectError) {
                    console.warn('فشل في إعادة الاتصال:', reconnectError);
                }
            }
            
            // التراجع للحفظ المحلي
            if (dataType === 'الأحداث الرياضية') {
                return saveSportsEventsToLocalStorage();
            } else if (dataType === 'بيانات القنوات') {
                return saveChannelDataToLocalStorage();
            }
            
            return false;
        }

        // Enhanced Mobile Touch Support
        function addTouchSupport() {
            if ('ontouchstart' in window) {
                document.body.classList.add('touch-device');

                // Add touch feedback
                document.addEventListener('touchstart', function(e) {
                    if (e.target.closest('.card, .channel-item, .search-result-item')) {
                        e.target.closest('.card, .channel-item, .search-result-item').style.transform = 'scale(0.98)';
                    }
                });

                document.addEventListener('touchend', function(e) {
                    if (e.target.closest('.card, .channel-item, .search-result-item')) {
                        setTimeout(() => {
                            e.target.closest('.card, .channel-item, .search-result-item').style.transform = '';
                        }, 150);
                    }
                });
            }
        }

        // Initialize performance optimizations
        document.addEventListener('DOMContentLoaded', function() {
            optimizeImages();
            addTouchSupport();

            // Preload critical resources
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            link.as = 'style';
            document.head.appendChild(link);
        });

        // Online/Offline Detection
        window.addEventListener('online', function() {
            showNotification('تم استعادة الاتصال بالإنترنت', 'success');
        });

        window.addEventListener('offline', function() {
            showNotification('انقطع الاتصال بالإنترنت', 'error');
        });



window.onload = () => {
    // إيجاد العناصر القابلة للنقر وإضافة tabindex إذا لم يكن موجود
    const clickable = document.querySelectorAll('a, button, [onclick]');
    clickable.forEach(el => {
        if (!el.hasAttribute('tabindex')) {
            el.setAttribute('tabindex', '0');
        }
    });

    // التركيز على أول عنصر تفاعلي عند التحميل
    if (clickable.length > 0) {
        clickable[0].focus();
        scrollIntoViewIfNeeded(clickable[0]);
    }

    // دالة التمرير التلقائي
    function scrollIntoViewIfNeeded(el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // دعم الأسهم وEnter للريموت
    document.addEventListener('keydown', function(e) {
        let focused = document.activeElement;
        let elements = Array.from(clickable);
        let index = elements.indexOf(focused);

        switch(e.key) {
            case "ArrowUp":
            case "ArrowLeft":
                if (index > 0) {
                    elements[index - 1].focus();
                    scrollIntoViewIfNeeded(elements[index - 1]);
                }
                break;
            case "ArrowDown":
            case "ArrowRight":
                if (index < elements.length - 1) {
                    elements[index + 1].focus();
                    scrollIntoViewIfNeeded(elements[index + 1]);
                }
                break;
            case "Enter":
                if (focused && typeof focused.click === 'function') {
                    focused.click();
                }
                break;
        }
    });
};

@@ .. @@
   const checkStreamStatus = async () => {
     try {
-      const response = await fetch('/api/streaming/status', {
+      const token = localStorage.getItem('token');
+      if (!token) return;
+      
+      const response = await fetch('/api/streaming/status', {
         headers: {
-          'Authorization': `Bearer ${localStorage.getItem('token')}`,
+          'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json',
         },
       });

@@ .. @@
       if (response.ok) {
         const data = await response.json();
         if (data.success) {
           setStreamData(prev => ({
             ...prev,
             isLive: data.is_live,
             title: data.transmission?.titulo || '',
             viewers: data.transmission?.stats?.viewers || 0,
             bitrate: data.transmission?.stats?.bitrate || 0,
             uptime: data.transmission?.stats?.uptime || '00:00:00'
           }));
         }
       }
     } catch (error) {
-      console.error('Error checking stream status:', error);
+      // Silenciar erro se não estiver autenticado
+      if (localStorage.getItem('token')) {
+        console.error('Error checking stream status:', error);
+      }
     }
   };
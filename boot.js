/* بوابة الدخول وفك التشفير */
(function(){
  "use strict";
  var SALT = "ChKefGzEA91WaJxdYQvCfw==", ITER = 310000, KEYNAME = "ft.k.v1";
  var KEY = null;
  var b64 = function(s){ var b = atob(s), a = new Uint8Array(b.length);
    for (var i=0;i<b.length;i++) a[i] = b.charCodeAt(i); return a; };

  function derive(user, pass){
    var encd = new TextEncoder().encode(user.trim().toLowerCase() + "\n" + pass);
    return crypto.subtle.importKey("raw", encd, "PBKDF2", false, ["deriveKey"])
      .then(function(base){
        return crypto.subtle.deriveKey(
          { name:"PBKDF2", salt:b64(SALT), iterations:ITER, hash:"SHA-256" },
          base, { name:"AES-GCM", length:256 }, true, ["decrypt"]);
      });
  }
  function decryptBuf(buf){
    var a = new Uint8Array(buf);
    return crypto.subtle.decrypt({ name:"AES-GCM", iv:a.slice(0,12) }, KEY, a.slice(12));
  }
  function getFile(p){ return fetch(p).then(function(r){
    if(!r.ok) throw new Error("fetch"); return r.arrayBuffer(); }); }

  window.__dec = function(p, mime){
    return getFile(p).then(decryptBuf).then(function(ab){
      return URL.createObjectURL(new Blob([ab], { type: mime || "image/jpeg" }));
    });
  };

  function boot(){
    return getFile("d/s.e").then(decryptBuf).then(function(css){
      var st = document.createElement("style");
      st.textContent = new TextDecoder().decode(css);
      document.head.appendChild(st);
      return getFile("d/p.e");
    }).then(decryptBuf).then(function(code){
      window.SECURE = true;
      document.getElementById("lock").remove();
      var s = document.createElement("script");
      s.textContent = new TextDecoder().decode(code);
      document.body.appendChild(s);
      var f = document.createElement("link");
      f.rel = "stylesheet";
      f.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Readex+Pro:wght@400;500;600;700&display=swap";
      document.head.appendChild(f);
    });
  }

  function unlock(user, pass, remember){
    return derive(user, pass).then(function(k){
      KEY = k;
      return getFile("d/k.e").then(decryptBuf);
    }).then(function(ab){
      var t = new TextDecoder().decode(ab);
      if (t.indexOf("OK::") !== 0) throw new Error("bad");
      if (remember) return crypto.subtle.exportKey("raw", KEY).then(function(raw){
        try{ localStorage.setItem(KEYNAME, btoa(String.fromCharCode.apply(null, new Uint8Array(raw)))); }catch(e){}
      });
    }).then(boot);
  }

  function tryStored(){
    var s; try{ s = localStorage.getItem(KEYNAME); }catch(e){ s = null; }
    if (!s) return Promise.reject();
    return crypto.subtle.importKey("raw", b64(s), "AES-GCM", true, ["decrypt"])
      .then(function(k){ KEY = k; return getFile("d/k.e").then(decryptBuf); })
      .then(function(ab){
        if (new TextDecoder().decode(ab).indexOf("OK::") !== 0) throw new Error("bad");
        return boot();
      });
  }

  document.addEventListener("DOMContentLoaded", function(){
    var form = document.getElementById("lf"), msg = document.getElementById("lm");
    tryStored().catch(function(){
      document.getElementById("lock").classList.add("ready");
      form.addEventListener("submit", function(e){
        e.preventDefault();
        var u = document.getElementById("lu").value, p = document.getElementById("lp").value;
        var r = document.getElementById("lr").checked;
        msg.textContent = "جارٍ التحقق…"; msg.className = "";
        form.querySelector("button").disabled = true;
        unlock(u, p, r).catch(function(){
          msg.textContent = "بيانات الدخول غير صحيحة."; msg.className = "err";
          form.querySelector("button").disabled = false;
          document.getElementById("lp").value = "";
        });
      });
    });
  });

  if ("serviceWorker" in navigator)
    addEventListener("load", function(){ navigator.serviceWorker.register("sw.js").catch(function(){}); });
})();

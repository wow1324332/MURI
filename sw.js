// PWA 앱 설치 기준을 충족하기 위한 최소한의 서비스 워커입니다.
// 기존 앱 로직에 전혀 영향을 주지 않도록 네트워크 요청을 그대로 통과시킵니다.
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // 오프라인 캐싱 로직 없이 기본 동작 유지
});

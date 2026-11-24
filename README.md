# Лаборатори №2: k6 ашиглан гүйцэтгэлийн хэмжүүр

**Оюутны мэдээлэл**

- Нэр: Батболд Анар
- Хичээл: F.CSA313 — Программ хангамжийн чанарын баталгаа ба тест

## k6 хувилбар

```text
k6.exe v2.2.0 (commit/00a9a1b7f5, go1.26.5, windows/amd64)
```

## Ажиллуулсан скрипт

Үндсэн тестийн скрипт: `script.js`

```javascript
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
};

export default function () {
  const res = http.get('https://test.k6.io');

  check(res, {
    'status 200 байна': (r) => r.status === 200,
  });

  sleep(1);
}
```

## 5 / 30 / 100 VU харьцуулалт

Доорх утга бүр `k6 run --vus N --duration 1m script.js` тушаалаар гарсан үнэн summary-наас авсан.

| VU | p90 (ms) | p95 (ms) | Throughput (req/s) | Error rate |
|---:|---:|---:|---:|---:|
| 5 | 222.45 | 224.42 | 7.72 | 0.00% |
| 30 | 226.38 | 228.42 | 45.99 | 0.00% |
| 100 | 227.23 | 234.52 | 143.69 | 0.00% |

Ачаалал 5 VU-ээс 100 VU хүртэл өсөхөд throughput 7.72-ээс 143.69 req/s болж 18.6 дахин өссөн. p95 latency 224.42-ээс 234.52 ms болж 10.10 ms буюу 4.5%-иар өслөө. 30 VU руу өсөхөд илт муудах цэг харагдаагүй боловч 100 VU бол throughput хамгийн өндөр ч илүү удаашрал болон тохиох мөрийн гүйцэтгэлийн хамгийн өндөр ачаалал байсан. Бүх түвшинд error rate 0.00% байсан.

## Stages тест

`stages.js` дээр 5 VU-аар 30 секунд халааж, 30 VU руу 1 минут өсгөж, 100 VU руу 30 секунд өргөж, дараа нь 30 секунд буулгана. Бүх түвшний нэгтгэсэн p95-г README-ийн хүснэгтэнд оруулаагүй. Тусдаа 5 / 30 / 100 VU ажиллуулалтын утгыг дээрх хүснэгтэд авсан. Stages-ийн бүтэн үр дүнг `results/run-stages.txt` файлаас уншиж болно.

## SLO, PASS ба FAIL threshold

5 VU үед хэмжсэн **baseline p95 = 224.42 ms** тул SLO-ийг baseline-ийн 1.5 дахин хувилж `224.42 × 1.5 = 336.63 ms` болгож, практик бүхэл босгоо `p95 < 337 ms` сонгосон. Энэ босго зөвхөн тусгай жишээ 300 ms-ийг хуулсан биш, өөрийн калибрцаан хэмжилтэд суурилсан. Error rate-ийн SLO нь `rate < 0.01` буюу 1%-ээс бага.

PASS тест: `threshold-pass.js`

```javascript
thresholds: {
  http_req_duration: ['p(95)<337'],
  http_req_failed: ['rate<0.01'],
}
```

FAIL тест: `threshold-fail.js`

```javascript
thresholds: {
  http_req_duration: ['p(95)<50'],
}
```

PASS ба FAIL ажиллуулалтын бүтэн текстээр гаралтыг `results/threshold-pass.txt` болон `results/threshold-fail.txt` файлаас уншиж болно. Screenshot-ууд: `screenshots/pass-threshold.png`, `screenshots/fail-threshold.png`.

## Локал серверийн нарийвчилсан тест

`local-server.js` нь `127.0.0.1:8080` дээр ажиллана:

- `/fast` шууд 200 хариулна.
- `/slow` 100 ms хойшилтоор 200 хариулна.

`local-test.js` 30 VU, 30 секунд ажиллуулж, хоёр endpoint-ийг хоёуланг нь тестэлнэ.

```text
node local-server.js
k6 run local-test.js
```

Локал тестийн үр дүнг `results/run-local.txt` файлаас харна.

Локал test-run-ийн гол үзүүлэлт:

| Үзүүлэлт | Утга |
|---|---:|
| p90 | 114.26 ms |
| p95 | 115.74 ms |
| Throughput | 54.04 req/s |
| Error rate | 0.00% |

Энэхүү test-run-д 840 iteration болон 1680 HTTP request боловсруулагдаж, `/fast` ба `/slow` хоёр endpoint-ийн 100% status check амжилттай давлаа.

## Дүгнэлт

Ачаалал өсөхөд throughput-аар секундэд боловсруулагдсан хүсэлтийн тоо мэдэгдэхүйц нэмэгдсэн. Энэ өсөлттэй зэрэгцэн p95 latency аажмаар нэмэгдсэн бөгөөд 100 VU-д илүү өндөр ачааллын нөлөө илүүтэй харагдсан. Бүх гадаад тест дээр error rate 0.00% байсан. Лекцийн latency, throughput, error rate, availability-тэй холбоотой зарчмуудыг практикаар баталсан. Нэгж хэрэглэгчийн туршлага 30 VU-ээс 100 VU руу шилжихэд илүү муудаж эхэлсэн бөгөөд max latency-гийн хэлбэлзэл ч нэмэгдсэн. Энэ лабораторид SLO-г өөрийн baseline p95 утга дээр үндэслэн тогтоож, PASS болон намертай FAIL quality gate-үүдийг үзүүлсэн. PASS threshold 30 VU-ийн үр дүнд хангасан. Локал серверийн `/slow` endpoint `/fast`-тай харьцуулахад latency өсөх ёстойг туршилтаар батална.

## Хавсаргасан файлууд

- Скрипт: `script.js`, `stages.js`, `threshold-pass.js`, `threshold-fail.js`
- Локал: `local-server.js`, `local-test.js`
- Бүтэн текст: `results/run-05vu.txt`, `results/run-30vu.txt`, `results/run-100vu.txt`, `results/run-stages.txt`, `results/threshold-pass.txt`, `results/threshold-fail.txt`, `results/run-local.txt`
- Зургийн screenshot: `screenshots/05vu.png`, `screenshots/30vu.png`, `screenshots/100vu.png`, `screenshots/pass-threshold.png`, `screenshots/fail-threshold.png`

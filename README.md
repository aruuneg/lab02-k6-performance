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

Доорх утга бүр `k6 run --vus N --duration 1m script.js` тушаалаар гарсан бүрэн summary-наас авсан.

| VU | p90 (ms) | p95 (ms) | Throughput (req/s) | Error rate |
|---:|---:|---:|---:|---:|
| 5 | 222.45 | 224.42 | 7.72 | 0.00% |
| 30 | 226.38 | 228.42 | 45.99 | 0.00% |
| 100 | 227.23 | 234.52 | 143.69 | 0.00% |

Ачаалал 5 VU-ээс 100 VU хүртэл өсөхөд throughput 7.72-ээс 143.69 req/s болж 18.6 дахин өссөн. p95 latency 224.42-ээс 234.52 ms болж 10.10 ms буюу 4.5%-иар өссөн. 30 VU руу өсөхөд илт муудах цэг харагдаагүй боловч 100 VU дээр хамгийн их ачаалал байсан бөгөөд удаашрал илүү тод харагдсан. Бүх түвшинд error rate 0.00% байсан.

Лекцийн 10 хэрэглэгчид 2 секунд, 100 хэрэглэгчид 4 секунд гэсэн жишээтэй харьцуулахад энэ лабораторийн өгөгдөл тэр загварыг батладаггүй. Манай p95 нь 5 VU-д 224.42 ms, 30 VU-д 228.42 ms, 100 VU-д 234.52 ms байсан бөгөөд latency 2 эсвэл 4 дахин өсөөгүй.

Throughput нь VU тоог өсгөхөд зохиомлоор өсдөг. Скрипт нь `sleep(1)` ашигладаг тул нэг VU ойролцоогоор нэг итераци/секунд гүйцэтгэнэ. 5 VU run нь ойролцоогоор 3.861 итераци/секунд буюу 235 итерацийг 60 секундэд гүйцэтгэсэн.

## Stages тест

`stages.js` дээр 5 VU-аар 30 секунд халааж, 30 VU руу 1 минут өсгөж, 100 VU руу 30 секунд өргөж, дараа нь 30 секунд буулгана. Бүх түвшний нэгтгэсэн p95-г хүснэгтэд оруулаагүй; 5 / 30 / 100 VU утгыг дээрх тусдаа хэмжилтийн хүснэгтээс авсан.

Stages run-ийн гол үр дүн:

- p90: 223.5 ms
- p95: 224.42 ms
- Хамгийн өндөр latency: 1.8 s
- Нийт iteration: 3,556
- Throughput: 47.15 req/s
- Error rate: 0%
- Өргөжүүлалтын оргил: 100 VU

Progress мөрүүдээр эхний 30 секундэд VU тоо аажмаар 5 орчим руу өссөн; дараагийн 1 минутын турш ачаалал 30 VU-ийн төвд хүрч, 100 VU оргилд өргөжсэн. 2 минутын орчимд VU буурч эхэлж, төгсгөлд 0 VU болсон. Бүрэн output `results/run-stages.txt` файлад хадгалагдсан.

## SLO, PASS ба FAIL threshold

5 VU үед хэмжсэн **baseline p95 = 224.42 ms** тул SLO-ийг baseline-ийн 1.5 дахин хувилж `224.42 × 1.5 = 336.63 ms` болгож, практик бүхэл босгоо `p95 < 337 ms` сонгосон. Энэ босго жишээ 300 ms-ийг шууд хуулсан биш, өөрийн калибрлэсэн хэмжилтэд суурилсан. Error rate-ийн SLO нь `rate < 0.01` буюу 1%-ээс бага.

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

PASS ба FAIL ажиллагааны бүрэн text output `results/threshold-pass.txt` болон `results/threshold-fail.txt` файлаар хавсаргасан. Screenshot-ууд: `screenshots/pass-threshold.png`, `screenshots/fail-threshold.png`.

PASS screenshot болон `threshold-pass.txt` нь өөр өөр run-ээс авсан учир p95 утга таарахгүй: screenshot дээр p95 226.67 ms, text output дээр 226.07 ms байна. Эдгээр run-уудын сүлжээний хэлбэлзэлээс үүдэлтэй ялгаа бөгөөд PASS нөхцөл хоёр run-д хоёулаа биелсэн.

## Локал серверийн нарийвчилсан тест

`local-server.js` нь `127.0.0.1:8080` дээр ажиллана:

- `/fast` шууд 200 хариулна.
- `/slow` 100 ms хойшилтоор 200 хариулна.

`local-test-tagged.js` 30 VU, 30 секунд ажиллуулж, хоёр endpoint-ийг тусдаа tag-р хэмжинэ.

```text
node local-server.js
k6 run local-test-tagged.js | tee results/run-local-tagged.txt
```

Локал tagged тестийн гол үр дүн:

| Үзүүлэлт | Утга |
|---|---:|
| `/fast` p90 | 2.04 ms |
| `/fast` p95 | 4.12 ms |
| `/slow` p90 | 114.7 ms |
| `/slow` p95 | 116.57 ms |
| Нийт throughput | 54.02 req/s |
| Error rate | 0.00% |

Энэ test-run-д 840 iteration болон 1680 HTTP request боловсруулагдаж, `/fast` ба `/slow` хоёр endpoint-ийн 100% status check амжилттай давлаа. `/slow`-ийн p95 116.57 ms нь `/fast`-ийн 4.12 ms-ээс тодорхой өндөр байсан нь 100 ms хойшилтын нөлөөг баталж байна. Бүрэн output `results/run-local-tagged.txt` файлд хадгалагдсан.

## Дүгнэлт

Ачаалал өсөхөд throughput-аар секундэд боловсруулагдсан хүсэлтийн тоо мэдэгдэхүйц нэмэгдсэн. p95 latency аажмаар өсөж, 100 VU-д илүү өндөр ачааллын нөлөө илүүтэй харагдсан. Бүх гадаад тест дээр error rate 0.00% байсан. Лекцийн latency, throughput, error rate ба availability-тэй холбоотой зарчмуудыг практик хэмжилтээр шалгасан. Нэгж хэрэглэгчийн туршлага 30 VU-ээс 100 VU руу шилжихэд илүү муудаж эхэлсэн бөгөөд max latency-ийн хэлбэлзэл ч нэмэгдсэн. Энэ лабораторид SLO-г өөрийн baseline p95 утга дээр үндэслэн тогтоож, PASS болон FAIL quality gate-ийг үзүүлсэн. PASS threshold 30 VU-ийн үр дүнд хангасан. Локал серверийн `/slow` endpoint `/fast`-тай харьцуулахад latency өссөн нь tagged measurement-аар шууд батлагдав.

## Хавсаргасан файлууд

- Скрипт: `script.js`, `stages.js`, `threshold-pass.js`, `threshold-fail.js`
- Локал: `local-server.js`, `local-test.js`, `local-test-tagged.js`
- Бүтэн текст: `results/run-05vu.txt`, `results/run-30vu.txt`, `results/run-100vu.txt`, `results/run-stages.txt`, `results/threshold-pass.txt`, `results/threshold-fail.txt`, `results/run-local.txt`, `results/run-local-tagged.txt`
- Зургийн screenshot: `screenshots/05vu.png`, `screenshots/30vu.png`, `screenshots/100vu.png`, `screenshots/pass-threshold.png`, `screenshots/fail-threshold.png`

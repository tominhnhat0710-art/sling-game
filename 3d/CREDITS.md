# Nguồn mô hình 3D dùng trong game

Tất cả mô hình dưới đây tải từ Poly Pizza. Danh sách này ghi lại tác giả để đúng
với giấy phép, vì Poly Pizza có cả mô hình CC0 (không cần ghi công) và CC-BY
(bắt buộc ghi công). Nếu game này được đưa lên công khai, phần này phải đi kèm.

## Xe

| Trong game | Mô hình | Tác giả |
|---|---|---|
| Xe cũ | Car (NormalCar2) | Poly by Google / Cars Bundle |
| Taxi | Taxi | Poly by Google / Cars Bundle |
| SUV | SUV | Poly by Google / Cars Bundle |
| Xe tuần tra | Police Car | Poly by Google / Cars Bundle |
| AE86 | Toyota AE86 | IvOfficial |
| RX-7 | Mazda RX-7 | IvOfficial |

## Cây và cỏ

| Trong game | Mô hình | Tác giả |
|---|---|---|
| Cây tán rộng | Tree | Marc Solà |
| Cây thông | Pine Trees | Quaternius |
| Cỏ xanh | grass green | Steve B |
| Cỏ pha | grass mix | Steve B |

## Đá

| Trong game | Mô hình | Tác giả |
|---|---|---|
| Đá nhỏ | Rocks | Quaternius |
| Đá cam | Rocks | Pixel |
| Đá to | Rock Large | Quaternius |
| Đá cụm | Rock | Quaternius |
| Đá vụn | basic stone 3 | felix stief |

## Động vật

| Trong game | Mô hình | Tác giả |
|---|---|---|
| Bò | Bull | Quaternius |
| Ngựa | Horse | Quaternius |
| Shiba | Shiba Inu | Quaternius |

## Cảnh trí

| Trong game | Mô hình | Tác giả |
|---|---|---|
| Hồ nước | Pond | Poly by Google |
| Ghế băng | Bench | IcyPassionis |
| Thác nước | Waterfall | Poly by Google |

## Thư viện

- three.js r185 (0.185.1), giấy phép MIT
- Rapier physics @dimforge/rapier3d-compat 0.20.0, giấy phép Apache-2.0

## Ghi chú kỹ thuật

Mọi mô hình đã được nén bằng meshopt (`gltf-transform optimize --compress
meshopt`), giảm từ khoảng 9 MB xuống 2,3 MB mà hình không đổi. Phần giải nén
trong game là `vendor/addons/libs/meshopt_decoder.module.js` của three.js.

Xe dạng .obj đã được chuyển sang .glb bằng `obj2gltf`.

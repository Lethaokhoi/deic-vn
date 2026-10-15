export const photos = {
  vinh: {
    src: '/images/vinh-tu-nui-quyet.jpg',
    alt: 'Thành phố Vinh nhìn từ núi Quyết, trời xanh phía trên cánh đồng và sông',
    credit: 'Nhcuong81, CC BY-SA 3.0, Wikimedia Commons',
  },
  cuaLo: {
    src: '/images/bai-bien-cua-lo.jpg',
    alt: 'Bãi biển Cửa Lò, Nghệ An',
    credit: 'Bùi Thụy Đào Nguyên, CC BY-SA 3.0, Wikimedia Commons',
  },
  daiLo: {
    src: '/images/dai-lo-vinh.jpg',
    alt: 'Đại lộ Lê-nin, thành phố Vinh',
    credit: 'Dungshc, phạm vi công cộng, Wikimedia Commons',
  },
  truongThi: {
    src: '/images/vong-xoay-truong-thi.jpg',
    alt: 'Vòng xoay Trường Thi, thành phố Vinh',
    credit: 'Bùi Thụy Đào Nguyên, CC BY-SA 3.0, Wikimedia Commons',
  },
  kinhTe: {
    src: '/images/truong-kinh-te-vinh.jpg',
    alt: 'Cổng Trường Đại học Kinh tế Nghệ An',
    credit: 'Fabrizio Berloco, CC BY-SA 4.0, Wikimedia Commons',
  },
} as const;

export type Photo = (typeof photos)[keyof typeof photos];

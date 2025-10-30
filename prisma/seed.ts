import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1️⃣ User 생성
  await prisma.user.createMany({
    data: [
      {
        uid: 'cmgtuser0000aaaa1111',
        email: 'buchon@example.com',
        passwd: 'hashed_pw_1',
        id: 'buchon01',
        name: '상동 이용자',
        phone: '01012345678',
        isVerified: true,
      },
      {
        uid: 'cmgtuser0000bbbb2222',
        email: 'incheon@example.com',
        passwd: 'hashed_pw_2',
        id: 'incheon01',
        name: '주안 이용자',
        phone: '01022345678',
        isVerified: true,
      },
      {
        uid: 'cmgtuser0000cccc3333',
        email: 'ansan@example.com',
        passwd: 'hashed_pw_3',
        id: 'ansan01',
        name: '안산 이용자',
        phone: '01032345678',
        isVerified: true,
      },
      {
        uid: 'cmgtuser0000dddd4444',
        email: 'suwon@example.com',
        passwd: 'hashed_pw_4',
        id: 'suwon01',
        name: '수원 이용자',
        phone: '01042345678',
        isVerified: true,
      },
    ],
  });

  // 2️⃣ Participant 생성
  await prisma.participant.createMany({
    data: [
      {
        participant_id: 'cmgtpuser0001aaaaaaa1111',
        party_id: 'cmgtgcvde0000vprgzmvixr3m',
        user_uid: 'cmgtuser0000aaaa1111',
        transport_mode: 'PUBLIC',
        role: 'MEMBER',
        code: 'BUCH1234',
        start_lat: new Prisma.Decimal(37.504322),
        start_lng: new Prisma.Decimal(126.76354),
        start_address: '경기도 부천시 원미구 상동역',
      },
      {
        participant_id: 'cmgtpuser0002bbbbbbb2222',
        party_id: 'cmgtgcvde0000vprgzmvixr3m',
        user_uid: 'cmgtuser0000bbbb2222',
        transport_mode: 'PUBLIC',
        role: 'MEMBER',
        code: 'INCHE5678',
        start_lat: new Prisma.Decimal(37.4564),
        start_lng: new Prisma.Decimal(126.7052),
        start_address: '인천광역시 미추홀구 주안역',
      },
      {
        participant_id: 'cmgtpuser0003ccccccc3333',
        party_id: 'cmgtgcvde0000vprgzmvixr3m',
        user_uid: 'cmgtuser0000cccc3333',
        transport_mode: 'PRIVATE',
        role: 'MEMBER',
        code: 'ANSAN9012',
        start_lat: new Prisma.Decimal(37.3188),
        start_lng: new Prisma.Decimal(126.8384),
        start_address: '경기도 안산시 상록구 중앙역',
      },
      {
        participant_id: 'cmgtpuser0004ddddddd4444',
        party_id: 'cmgtgcvde0000vprgzmvixr3m',
        user_uid: 'cmgtuser0000dddd4444',
        transport_mode: 'PRIVATE',
        role: 'MEMBER',
        code: 'SUWON3456',
        start_lat: new Prisma.Decimal(37.2665),
        start_lng: new Prisma.Decimal(127.0008),
        start_address: '경기도 수원시 팔달구 수원역',
      },
    ],
  });

  console.log('✅ User + Participant 데이터 생성 완료');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());

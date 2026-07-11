import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';

const SALON_SERVICES: Array<Partial<Service>> = [
  {
    title: 'Signature Facial',
    description:
      'A deep-cleansing, hydrating facial customised to your skin type.',
    duration: 60,
    price: 55.0,
    isActive: true,
  },
  {
    title: 'Haircut & Blow Dry',
    description: 'Professional cut and style by our senior stylists.',
    duration: 45,
    price: 35.0,
    isActive: true,
  },
  {
    title: 'Hair Colour',
    description: 'Full-head colour with premium, ammonia-free products.',
    duration: 120,
    price: 90.0,
    isActive: true,
  },
  {
    title: 'Gel Manicure',
    description: 'Long-lasting gel polish with nail shaping and cuticle care.',
    duration: 45,
    price: 30.0,
    isActive: true,
  },
  {
    title: 'Spa Pedicure',
    description: 'Relaxing foot soak, scrub, massage and polish.',
    duration: 60,
    price: 40.0,
    isActive: true,
  },
  {
    title: 'Bridal Makeup',
    description: 'Complete bridal look including trial session.',
    duration: 90,
    price: 150.0,
    isActive: true,
  },
  {
    title: 'Relaxing Full Body Massage',
    description: 'Aromatherapy full body massage to relieve tension.',
    duration: 60,
    price: 70.0,
    isActive: true,
  },
  {
    title: 'Eyelash Extensions',
    description: 'Classic individual lash extensions for a fuller look.',
    duration: 90,
    price: 65.0,
    isActive: false,
  },
];

async function seed(): Promise<void> {
  const dataSource = await AppDataSource.initialize();
  try {
    const userRepo = dataSource.getRepository(User);
    const serviceRepo = dataSource.getRepository(Service);

    const adminEmail = 'admin@romandbeauty.com';
    const existingAdmin = await userRepo.findOne({
      where: { email: adminEmail },
    });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('Admin@1234', 10);
      await userRepo.save(
        userRepo.create({
          name: 'Salon Admin',
          email: adminEmail,
          passwordHash,
        }),
      );
      console.log(`Seeded admin user: ${adminEmail} / Admin@1234`);
    } else {
      console.log('Admin user already exists, skipping.');
    }

    for (const data of SALON_SERVICES) {
      const exists = await serviceRepo.findOne({
        where: { title: data.title },
      });
      if (!exists) {
        await serviceRepo.save(serviceRepo.create(data));
        console.log(`Seeded service: ${data.title}`);
      }
    }

    console.log('Seeding complete.');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});

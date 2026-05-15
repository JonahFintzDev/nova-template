import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Check if any users exist
  const userCount = await prisma.user.count();
  
  if (userCount === 0) {
    console.log('No users found. Creating initial admin user...');
    // You can create an initial admin user here if needed
    // const admin = await prisma.user.create({
    //   data: {
    //     username: 'admin',
    //     password: await hash('admin', 10), // bcrypt hash
    //     isAdmin: true,
    //   },
    // });
    // console.log('Created admin user:', admin.username);
  }

  // Ensure app settings exist
  const settingsCount = await prisma.appSettings.count();
  if (settingsCount === 0) {
    console.log('No app settings found. Creating default settings...');
    await prisma.appSettings.create({
      data: {
        registrationEnabled: true,
        commentsEnabled: true,
      },
    });
    console.log('Created default app settings');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

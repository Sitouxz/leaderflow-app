
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAccounts() {
  try {
    const accounts = await prisma.socialAccount.findMany();
    console.log('--- Social Accounts in DB ---');
    if (accounts.length === 0) {
      console.log('No accounts found.');
    } else {
      accounts.forEach(acc => {
        console.log(`ID: ${acc.id}, Platform: ${acc.platform}, Has Token: ${!!acc.accessToken}, Has RefreshToken (IG ID): ${!!acc.refreshToken}`);
      });
    }
    console.log('-----------------------------');
  } catch (error) {
    console.error('Error querying DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAccounts();

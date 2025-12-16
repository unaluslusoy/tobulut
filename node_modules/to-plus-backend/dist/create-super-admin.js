const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
    const email = 'super.test@tobulut.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    let systemTenant = await prisma.tenant.findUnique({ where: { tag: 'system' } });
    if (!systemTenant) {
        console.log('Creating system tenant...');
        systemTenant = await prisma.tenant.create({
            data: {
                tag: 'system',
                name: 'System Tenant',
                type: 'corporate',
                status: 'active'
            }
        });
    }
    const user = await prisma.user.create({
        data: {
            tenantId: systemTenant.id,
            name: 'Super Test',
            email: email,
            passwordHash: hashedPassword,
            role: 'superuser',
            isSuperAdmin: true,
            permissions: {},
            status: 'active'
        },
    });
    console.log(`Created Super Admin: ${user.email} / ${password}`);
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=create-super-admin.js.map
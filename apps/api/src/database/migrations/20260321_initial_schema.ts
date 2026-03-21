import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.createTable('users', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('CLIENT', 'VENDOR_OWNER', 'ADMIN'), defaultValue: 'CLIENT', allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('vendors', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    ownerUserId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    businessName: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    basePrice: { type: DataTypes.FLOAT, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    approved: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('bookings', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    vendorId: { type: DataTypes.UUID, allowNull: false, references: { model: 'vendors', key: 'id' } },
    clientUserId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'), defaultValue: 'PENDING' },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('notifications', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    type: { type: DataTypes.ENUM('MESSAGE', 'BOOKING_CREATED', 'BOOKING_ACCEPTED', 'BOOKING_REJECTED', 'VENDOR_APPROVED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'ADMIN_ANNOUNCEMENT'), allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    href: { type: DataTypes.STRING, allowNull: true },
    readAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.dropTable('notifications');
  await queryInterface.dropTable('bookings');
  await queryInterface.dropTable('vendors');
  await queryInterface.dropTable('users');
};

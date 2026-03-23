import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';
import { Booking } from './booking.model';
import { User } from './user.model';

export class Transaction extends Model {
  declare id: string;
  declare bookingId: string | null;
  declare userId: string; 
  declare amount: number;
  declare currency: string;
  declare provider: 'PAYHERE' | 'STRIPE';
  declare providerTransactionId: string;
  declare status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'PAID_TO_VENDOR';
  declare type: 'DEPOSIT' | 'FULL' | 'PAYOUT';
  declare metadata: any; 
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'LKR',
    },
    provider: {
      type: DataTypes.ENUM('PAYHERE', 'STRIPE'),
      allowNull: false,
    },
    providerTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'PAID_TO_VENDOR'),
      defaultValue: 'PENDING',
    },
    type: {
      type: DataTypes.ENUM('DEPOSIT', 'FULL', 'PAYOUT'),
      defaultValue: 'DEPOSIT',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: true,
  }
);

Transaction.belongsTo(Booking, { foreignKey: { name: 'bookingId', allowNull: true }, as: 'booking', onDelete: 'SET NULL' });
Booking.hasMany(Transaction, { foreignKey: { name: 'bookingId', allowNull: true }, as: 'transactions', onDelete: 'SET NULL' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

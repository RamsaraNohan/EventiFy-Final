import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';
import { Conversation } from './conversation.model';
import { User } from './user.model';

export class Message extends Model {
  declare id: string;
  declare conversationId: string;
  declare senderUserId: string;
  declare body: string;
  declare attachments: string; // Stored as JSON string
  declare readAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'conversations', key: 'id' },
    },
    senderUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachments: {
      type: DataTypes.TEXT, // Alternatively JSON type if supported well across DBs
      allowNull: true,
      get() {
        const raw = this.getDataValue('attachments');
        return raw ? JSON.parse(raw) : [];
      },
      set(val: any) {
        this.setDataValue('attachments', JSON.stringify(val));
      }
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true,
  }
);

Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'senderUserId', as: 'sender' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });



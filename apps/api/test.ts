import { Conversation, Vendor, User, Message } from './src/database';

async function run() {
  try {
    const res = await Conversation.findAll({
      where: { clientUserId: '22222222-2222-2222-2222-222222222222' },
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'businessName'] },
        { model: User, as: 'client', attributes: ['id', 'name', 'avatar'] },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
        }
      ],
      order: [['lastMessageAt', 'DESC']]
    });
    console.log("Success:", res.length);
  } catch (e: any) {
    console.error("CRASH MSG:", e.message);
  }
}
run();

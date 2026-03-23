import { Vendor } from '../database';
import { generateEmbedding } from '../utils/embeddings';
import { vectorClient } from '../utils/vectorClient';
import { sequelize } from '../database/sequelize';

async function reindex() {
  try {
    console.log('--- Starting Reindexing ---');
    await sequelize.authenticate();
    
    const vendors = await Vendor.findAll({ where: { approved: true } });
    console.log(`Found ${vendors.length} approved vendors to index.`);

    for (const vendor of vendors) {
      const textToEmbed = `${vendor.businessName} ${vendor.category} ${vendor.city} ${vendor.description}`;
      const embedding = await generateEmbedding(textToEmbed);
      
      await vectorClient.upsert([{
        id: vendor.id,
        values: embedding,
        metadata: {
          businessName: vendor.businessName,
          category: vendor.category,
          city: vendor.city
        }
      }]);
      
      console.log(`Indexed: ${vendor.businessName}`);
    }

    console.log('--- Reindexing Complete ---');
    process.exit(0);
  } catch (error) {
    console.error('Reindexing failed:', error);
    process.exit(1);
  }
}

reindex();

import { Vendor } from '../database';
import { generateEmbedding } from '../utils/embeddings';
import { vectorClient } from '../utils/vectorClient';
import { logger } from '../utils/logger';

async function reindex() {
  try {
    logger.info('Starting Vendor Reindexing Module...');
    
    // Fetch all approved vendors
    const vendors = await Vendor.findAll({ where: { approved: true } });
    logger.info(`Found ${vendors.length} vendors to index.`);

    const records = [];

    for (const vendor of vendors) {
      const text = `${vendor.businessName} ${vendor.category} ${vendor.description} ${vendor.city}`;
      logger.info(`Generating embedding for: ${vendor.businessName}`);
      
      const values = await generateEmbedding(text);
      
      records.push({
        id: vendor.id,
        values,
        metadata: {
          businessName: vendor.businessName,
          category: vendor.category,
          city: vendor.city,
        }
      });
    }

    if (records.length > 0) {
      logger.info('Pushing vectors to Vector Nexus...');
      await vectorClient.upsertVendors(records);
      logger.info('Reindexing Complete.');
    } else {
      logger.warn('No vendors found for indexing.');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Critical Failure in Reindexing Module:', error);
    process.exit(1);
  }
}

reindex();

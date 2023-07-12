import { Router } from 'express';
import { getUserItems, searchUserItems, getSingleItem, updateItemLocationQuantity, test } from '../controllers/itemController';

const router = Router();

router.get('/items/:id', getUserItems);
router.get('/searchItems/:id/:searchQuery', searchUserItems);
router.get('/singleItem/:userId/:itemId', getSingleItem);
router.get('/updateQuantityByLocation/:id/:itemId/:locationId/:amount', test);

export default router;
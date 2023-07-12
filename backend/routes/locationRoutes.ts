import { Router } from 'express';
import { addUserLocation, deleteUserLocation, getItemsInLocations, getLocations } from '../controllers/locationController';

const router = Router();

router.get('/locations/:id', getLocations);
router.get('/locationItems/:userId/:locationId', getItemsInLocations);
router.patch('/locationAdd', addUserLocation);
router.patch('/locationDelete', deleteUserLocation);

export default router;
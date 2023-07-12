import { Request, Response } from 'express';
import { LocationModel } from '../models/locationModel';
import { ObjectId } from 'mongodb';
import { ItemModel } from '../models/itemModel';

export const getLocations = async (req: Request, res: Response) => {
    const userId = req.params.id;
    try {
        const document = await LocationModel.findOne({ user_id: new ObjectId(userId) });
        if (!document) {
            return res.json({ message: 'Document not found' });
        }
        res.json(document.locations);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}

// export const getItemsInLocations = async (req: Request, res: Response) => {
//     const userId = req.params.userId;
//     const locationId = req.params.locationId;

//     const items = await ItemModel.aggregate([
//         {
//             $match: {
//                 "user_inventory": {
//                     $elemMatch: {
//                         "user_id": {
//                             $eq: new ObjectId("6435dd6c700d5d798c1d0d52") // replace with user_id
//                         },
//                         "locations": {
//                             $elemMatch: {
//                                 "_id": {
//                                     $eq: new ObjectId("6436c78d7bd2bbd271205b7c") // replace with location _id
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         },
//         {
//             $project: {
//                 "name": 1,
//                 "image_url": 1,
//                 "quote": 1,
//                 "rarity": 1,
//                 "category": 1,
//                 "weight": 1,
//                 "required_level": 1,
//                 "crafting_time": 1,
//                 "crafted_in": 1,
//                 "ingredients": 1,
//                 "user_inventory": {
//                     $filter: {
//                         input: "$user_inventory",
//                         as: "user_inv",
//                         cond: {
//                             $and: [
//                                 {
//                                     $eq: [
//                                         "$$user_inv.user_id",
//                                         new ObjectId("6435dd6c700d5d798c1d0d52") // replace with user_id
//                                     ]
//                                 },
//                                 {
//                                     $anyElementTrue: {
//                                         $map: {
//                                             input: "$$user_inv.locations",
//                                             as: "loc",
//                                             in: {
//                                                 $eq: ["$$loc._id", new ObjectId("6436c78d7bd2bbd271205b7c")] // replace with location _id
//                                             }
//                                         }
//                                     }
//                                 }
//                             ]
//                         }
//                     }
//                 }
//             }
//         }
//     ]);

//       res.json(items)
// }

export const getItemsInLocations = async (req: Request, res: Response) => {
    const items = await ItemModel.aggregate([
        {
            $match: {
                "user_inventory": {
                    $elemMatch: {
                        "user_id": new ObjectId(req.params.userId), // replace with user_id
                        "locations._id": new ObjectId(req.params.locationId) // replace with location _id
                    }
                }
            }
        },{
            $match: {
                "user_inventory": {
                    $elemMatch: {
                        "user_id": new ObjectId(req.params.userId),
                        "locations": {
                            $elemMatch: {
                                "_id": new ObjectId(req.params.locationId),
                                "quantity": { $gt: 0 }
                            }
                        }
                    }
                }
            }
        },
        {
            $project: {
                "name": 1,
                "image_url": 1,
                "quote": 1,
                "rarity": 1,
                "category": 1,
                "weight": 1,
                "required_level": 1,
                "crafting_time": 1,
                "crafted_in": 1,
                "ingredients": 1,
                "user_inventory": {
                    $filter: {
                        input: "$user_inventory",
                        as: "user_inv",
                        cond: {
                            $and: [
                                { $eq: ["$$user_inv.user_id", new ObjectId(req.params.userId)] }, // replace with user_id
                                { $anyElementTrue: { $map: { input: "$$user_inv.locations", as: "loc", in: { $eq: ["$$loc._id", new ObjectId(req.params.locationId)] } } } } // replace with location _id
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: {
                "name": 1,
                "image_url": 1,
                "quote": 1,
                "rarity": 1,
                "category": 1,
                "weight": 1,
                "required_level": 1,
                "crafting_time": 1,
                "crafted_in": 1,
                "ingredients": 1,
                "user_inventory": {
                    $map: {
                        input: "$user_inventory",
                        as: "user_inv",
                        in: {
                            "user_id": "$$user_inv.user_id",
                            "locations": {
                                $filter: {
                                    input: "$$user_inv.locations",
                                    as: "loc",
                                    cond: { $eq: ["$$loc._id", new ObjectId(req.params.locationId)] } // replace with location _id
                                }
                            }
                        }
                    }
                }
            }
        }
    ]);

    return res.json(items)
}

export const deleteUserLocation = async (req: Request, res: Response) => {
    const { id, locationId } = req.body;


    // Find the document that matches the user_id
    const location = await LocationModel.findOne({ user_id: new ObjectId(id) });
  
    if (!location) {
      return res.json({ message: 'Location not found' });
    }
  
    // Remove the location from the locations array
    location.locations = location.locations?.filter(location => location._id.toString() !== locationId);
  
    // Save the updated location document
    await location.save();
    ///test

    console.log(locationId)

    await ItemModel.updateMany(
        {
            'user_inventory.user_id': new ObjectId(id),
            'user_inventory.locations._id': new ObjectId(locationId),
        },
        {
            $pull: {
                'user_inventory.$.locations': { _id: new ObjectId(locationId) },
            },
        }
    )

    const document = await LocationModel.findOne({ user_id: new ObjectId(id) });
    if (!document) {
        return res.status(404).json({ message: 'Document not found' });
    }

    return res.json({status: true, locations: document.locations});
}

export const addUserLocation = async (req: Request, res: Response) => {
    const { id, name, longitude, latitude, color } = req.body;
    // console.log(req.body)
    try {
        const location = await LocationModel.findOne({ user_id: new ObjectId(id) });

        if (!location) {
            return { success: false, message: 'No location found for this user.' };
        }
  
        const newLocation = {
            name: name,
            longitude: longitude,
            latitude: latitude,
            active: false,
            color: color,
            _id: new ObjectId() as any // Use the ObjectId constructor directly
        };
  
        location?.locations?.push(newLocation);
        await location?.save();

        const document = await LocationModel.findOne({ user_id: new ObjectId(id) });
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
    
        return res.json({status: true, locations: document.locations});
  
    } catch (error) {
        return { success: false, message: error };
    }
  };
import { Router } from 'express';
import { vendorController } from '@/controllers/vendor.controller.js';

export const vendorRoutes = Router();

// Read access: CITIZEN, OFFICIAL, AUDITOR, ADMIN
vendorRoutes.get('/', vendorController.getVendors);
vendorRoutes.get('/:id', vendorController.getVendorById);

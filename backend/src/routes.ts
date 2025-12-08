import { Router } from 'express';
import * as authController from './controllers/authController';
import * as clientController from './controllers/clientController';
import * as dealController from './controllers/dealController';
import * as ticketController from './controllers/ticketController';
import { authenticateToken } from './middleware/authMiddleware';

export const router = Router();

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// Protected Routes
router.use(authenticateToken);

// User Routes
import * as userController from './controllers/userController';
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Client Routes
router.get('/clients', clientController.getClients);
router.post('/clients', clientController.createClient);
router.get('/clients/:id', clientController.getClient);

// Deal Routes
router.get('/deals', dealController.getDeals);
router.post('/deals', dealController.createDeal);
router.patch('/deals/:id/stage', dealController.updateDealStage);

// Ticket Routes
router.get('/tickets', ticketController.getTickets);
router.post('/tickets', ticketController.createTicket);
router.get('/tickets/trash', ticketController.getTrashedTickets);
router.patch('/tickets/:id/status', ticketController.updateTicketStatus);
router.post('/tickets/:id/restore', ticketController.restoreTicket);
router.delete('/tickets/:id', ticketController.softDeleteTicket);

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');

// Carrega variáveis de ambiente
dotenv.config();

// Rotas
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const authRouter = require('./routes/auth');
const companiesRouter = require('./routes/companies');
const favoritesRouter = require('./routes/favorites');
const couponsRouter = require('./routes/coupons');
const userCouponsRouter = require('./routes/userCoupons');
const addressesRouter = require('./routes/addresses');
const ordersRouter = require('./routes/orders');
const companyOrdersRouter = require('./routes/companyOrders');
const notificationsRouter = require('./routes/notifications');
const paymentMethodsRouter = require('./routes/paymentMethods');
const cartRouter = require('./routes/cart');
const reviewsRouter = require('./routes/reviews');
const notificationSettingsRouter = require('./routes/notificationSettings');
const recommendationsRouter = require('./routes/recommendations');
const companyDashboardRouter = require('./routes/companyDashboard');
const staffRouter = require('./routes/staff');
const stockRoutes = require('./routes/stock');
const userReviewsRoutes = require('./routes/userReviews');
const companyBlockRoutes = require('./routes/companyBlock');

const app = express();
app.use(express.json());

// 🔌 Conexão com MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('🟢 Conectado ao MongoDB Atlas'))
.catch(err => {
  console.error('🔴 Erro ao conectar ao MongoDB:', err.message);
  process.exit(1);
});

// 🧩 Registro de rotas
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/auth', authRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/user-coupons', userCouponsRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/company-orders', companyOrdersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/payment-methods', paymentMethodsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/notification-settings', notificationSettingsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/company-dashboard', companyDashboardRouter);
app.use('/api/staff', staffRouter);
app.use('/api/stock', stockRoutes);
app.use('/api/user-reviews', userReviewsRoutes);
app.use('/api/companies', companyBlockRoutes);

// 📘 Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 🚀 Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

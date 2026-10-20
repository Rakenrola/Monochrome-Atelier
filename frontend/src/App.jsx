import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CartPage from './pages/CartPage';
import Login from './pages/Login';
import Account from './pages/Account';
import AdminDashboard from './pages/AdminDashboard';
import Receipt from './pages/Receipt';
import { replaceCart } from './store/cartSlice';

function HomeRoute() {
  const user = useSelector((state) => state.auth?.user);
  return user?.role === 'admin' ? <Navigate to="/admin" replace /> : <Home />;
}

function CartPersistence() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const [syncError, setSyncError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const isReady = useRef(false);
  const writeQueue = useRef(Promise.resolve());
  const cartItemsRef = useRef(cartItems);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    if (!token) {
      isReady.current = false;
      return undefined;
    }

    let active = true;
    isReady.current = false;
    const guestItems = cartItemsRef.current.map(({ id, quantity }) => ({
      id,
      quantity: quantity || 1
    }));

    axios
      .post(
        '/api/cart/merge',
        { items: guestItems },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        if (!active) return;
        isReady.current = true;
        setSyncError('');
        dispatch(replaceCart(response.data.items));
      })
      .catch((error) => {
        if (active) {
          setSyncError(
            error.response?.data?.message ||
              error.message ||
              'Unable to load your saved cart.'
          );
        }
      });

    return () => {
      active = false;
      isReady.current = false;
    };
  }, [token, user?.id, retryCount, dispatch]);

  useEffect(() => {
    if (!token || !isReady.current) return;

    const items = cartItems.map(({ id, quantity }) => ({
      id,
      quantity: quantity || 1
    }));
    const write = writeQueue.current
      .catch(() => {})
      .then(() =>
        axios.put(
          '/api/cart',
          { items },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
    writeQueue.current = write;

    write
      .then(() => setSyncError(''))
      .catch((error) => {
        setSyncError(
          error.response?.data?.message ||
            error.message ||
            'Unable to save your cart.'
        );
      });
  }, [cartItems, token]);

  return syncError ? (
    <div
      role="alert"
      style={{
        padding: '10px 16px',
        backgroundColor: '#311',
        color: '#fff',
        textAlign: 'center',
        fontSize: '0.8rem'
      }}
    >
      CART SYNC ERROR: {syncError}{' '}
      <button
        type="button"
        onClick={() => setRetryCount((count) => count + 1)}
        style={{ marginLeft: '8px' }}
      >
        RETRY
      </button>
    </div>
  ) : null;
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <CartPersistence />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/receipt" element={<Receipt />} />
      </Routes>
    </Router>
  );
}
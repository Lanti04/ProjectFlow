// ========== REGISTRATION PAGE ==========
// New user signup with name, email & password
// Hashes password server-side & generates JWT token
import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterPage({ setToken }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ========== HANDLE REGISTRATION SUBMISSION ==========
  // Creates new user account, stores token, & navigates to dashboard
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password,
      });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
    fontFamily: 'Arial, sans-serif'
  }}>
    <div style={{
      width: '100%',
      maxWidth: '420px',
      padding: '40px 30px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      textAlign: 'center'
    }}>
      <h1 style={{ margin: '0 0 30px 0', color: '#1a1a1a', fontSize: '32px' }}>
        ProjectFlow
      </h1>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Register</h2>

      {error && <p style={{ color: '#e74c3c', marginBottom: '15px' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '14px',
            margin: '10px 0',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '14px',
            margin: '10px 0',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '14px',
            margin: '10px 0',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
        />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '14px',
            marginTop: '10px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Register
        </button>
      </form>

      <p style={{ marginTop: '25px', color: '#666' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
          Login
        </Link>
      </p>
    </div>
  </div>
);
}
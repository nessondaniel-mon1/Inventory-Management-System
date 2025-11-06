import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { db } from '../firebase';

const GemIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="m12 22 4-13-3-6"/><path d="M12 22 8 9l3-6"/></svg>
);
  
const LoginPage: React.FC = () => {
    const { login } = useInventory();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Find user by username
            const usersQuery = db.collection('users').where('name', '==', username.trim()).limit(1);
            const querySnapshot = await usersQuery.get();

            if (querySnapshot.empty) {
                setError('Invalid username or password.');
                setIsLoading(false);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userEmail = userDoc.data().email;

            if (!userEmail) {
                setError('Could not find email for this user. Account may be corrupted.');
                setIsLoading(false);
                return;
            }
            
            await login(userEmail, password);
            // On successful login, the App component will automatically re-render
            // the main layout due to the currentUser state change. No navigation needed here.
        } catch (err: any) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Invalid username or password.');
            } else {
                setError(err.message || 'An unknown error occurred.');
            }
            setIsLoading(false);
        }
        // No need to set isLoading to false in the success case, 
        // as the component will be unmounted.
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-md" title="Welcome to Inventory Pro">
                <div className="text-center mb-6">
                    <img src="/logo.png" alt="Logo" className="h-16 w-auto mx-auto" />
                    <p className="text-text-secondary mt-2">Please sign in to continue</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                        label="Username"
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoFocus
                        disabled={isLoading}
                    />
                    <Input
                        label="Password"
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Spinner size="sm" /> : 'Sign In'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default LoginPage;

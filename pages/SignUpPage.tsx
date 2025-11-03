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

const SignUpPage: React.FC = () => {
    const { registerAdmin } = useInventory();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            // Check for username uniqueness
            const usersQuery = db.collection('users').where('name', '==', name.trim()).limit(1);
            const querySnapshot = await usersQuery.get();

            if (!querySnapshot.empty) {
                setError('Username is already taken. Please choose another one.');
                setIsLoading(false);
                return;
            }

            await registerAdmin(email, name.trim(), password);
            // On successful registration, the App component will automatically
            // re-render the main layout because the currentUser state is now set.
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError('This email address is already in use.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                 setError(err.message || 'An unknown error occurred during setup.');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-md" title="Welcome to Inventory Pro Setup">
                <div className="text-center mb-6">
                    <GemIcon className="h-12 w-12 text-primary mx-auto" />
                    <p className="text-text-secondary mt-2">Create your primary administrator account to get started.</p>
                </div>
                <form onSubmit={handleSignUp} className="space-y-4">
                     <Input
                        label="Username"
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoFocus
                        disabled={isLoading}
                    />
                    <Input
                        label="Email Address"
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
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
                        {isLoading ? <Spinner size="sm" /> : 'Create Account & Sign In'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default SignUpPage;

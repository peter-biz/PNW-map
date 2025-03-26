'use client';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "../../lib/supabase";

function VerifyEmailContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  if (!email) {
    return <div>No email found</div>;
  }

  return (
    <div className="w-full max-w-md space-y-8 p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Check your email</h2>
        <div className="mb-8">
          <svg
            className="mx-auto h-12 w-12 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        
        <p className="text-gray-600 mb-4">
          We sent a verification link to:
          <br />
          <span className="font-medium text-gray-900">{email}</span>
        </p>
        
        <p className="text-sm text-gray-500 mb-8">
          Click the link in the email to verify your account.
          The link will expire in 24 hours.
        </p>

        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="block w-full text-center p-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Sign In
          </Link>
          
          <p className="text-sm text-gray-500">
            Didn't receive the email?{' '}
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: email,
                  });
                  if (error) throw error;
                  alert('Verification email resent!');
                } catch (error) {
                  alert('Error sending verification email');
                } finally {
                  setLoading(false);
                }
              }}
              className="text-blue-600 hover:text-blue-500 disabled:text-gray-400"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Click to resend'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={
        <div className="text-center">
          <p>Loading...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
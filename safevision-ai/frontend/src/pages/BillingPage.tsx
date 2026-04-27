import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { getPlans, getSubscription } from '../services/api';
import type { SubscriptionPlan } from '../types';
import clsx from 'clsx';

export default function BillingPage() {
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({});
  const [currentPlan, setCurrentPlan] = useState('');

  useEffect(() => {
    getPlans().then((r) => setPlans(r.data)).catch(() => {});
    getSubscription()
      .then((r) => setCurrentPlan(r.data.plan))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-slate-400">Manage your subscription plan</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            className={clsx(
              'rounded-xl border p-6 transition-colors',
              currentPlan === key
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            )}
          >
            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
            <div className="mt-2">
              <span className="text-4xl font-bold text-white">
                {'\u20AC'}{plan.price_monthly}
              </span>
              <span className="text-slate-400"> / month / location</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Up to {plan.max_cameras} cameras
            </p>

            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-slate-300"
                >
                  <Check className="h-4 w-4 shrink-0 text-blue-400" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={clsx(
                'mt-6 w-full rounded-lg py-2.5 text-sm font-medium transition-colors',
                currentPlan === key
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
              disabled={currentPlan === key}
            >
              {currentPlan === key ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

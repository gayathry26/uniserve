import React from 'react';

const mockTransactions = [
  { id: 'TXN-001', date: '2026-08-10', amount: '₹85,000.00', type: 'Credit', description: 'Salary - TCS Ltd', status: 'Completed', reference: 'IMPS/321456789' },
  { id: 'TXN-002', date: '2026-08-09', amount: '₹4,500.00', type: 'Debit', description: 'DMart - Groceries', status: 'Completed', reference: 'UPI/321456790' },
  { id: 'TXN-003', date: '2026-08-08', amount: '₹1,250.00', type: 'Debit', description: 'BESCOM Electricity Bill', status: 'Completed', reference: 'BBPS/321456791' },
  { id: 'TXN-004', date: '2026-08-05', amount: '₹12,500.00', type: 'Credit', description: 'UPI Transfer - Rahul', status: 'Completed', reference: 'UPI/321456792' },
  { id: 'TXN-005', date: '2026-08-01', amount: '₹350.00', type: 'Debit', description: 'Swiggy Instamart', status: 'Pending', reference: 'UPI/321456793' }
];

export default function BankData() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-neutral-100 dark:bg-neutral-900 border border-border text-foreground px-6 py-8 sm:p-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Account Statement</h1>
              <p className="mt-2 text-muted-foreground font-medium">Account Holder: Hari</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="p-6 sm:p-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Recent Transactions</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{txn.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{txn.description}</div>
                      <div className="text-xs text-gray-500">{txn.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{txn.reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className={txn.type === 'Credit' ? 'text-foreground' : 'text-gray-900'}>
                        {txn.type === 'Credit' ? '+' : '-'}{txn.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        txn.status === 'Completed' ? 'bg-secondary text-foreground text-foreground' : 'bg-secondary text-foreground text-foreground'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
            <p>Showing {mockTransactions.length} recent transactions.</p>
            <p>Generated securely on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

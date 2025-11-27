import React from 'react';
import type { User, Collection, PaymentStatuses } from '../types';
import UserListItem from './UserListItem';

interface UserListProps {
  users: User[];
  collection: Collection;
  paymentStatuses: PaymentStatuses;
  onUpdateClick: (user: User) => void;
  onQuickSetPayment: (userId: string, amount: number) => void;
  onViewProfile: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  collection,
  paymentStatuses,
  onUpdateClick,
  onQuickSetPayment,
  onViewProfile,
}) => {
  return (
    <ul role="list" className="divide-y divide-slate-100">
      {users.length > 0 ? (
        users.map((user) => {
          const paymentStatus = paymentStatuses[user.id]?.[collection.id];
          return (
            <UserListItem
              key={user.id}
              user={user}
              paymentStatus={paymentStatus}
              collectionAmount={collection.amountPerUser}
              onUpdateClick={() => onUpdateClick(user)}
              onQuickSetPayment={(amount) => onQuickSetPayment(user.id, amount)}
              onViewProfile={() => onViewProfile(user)}
            />
          );
        })
      ) : (
        <li className="text-center py-8 text-gray-500">
          No students match the current filters.
        </li>
      )}
    </ul>
  );
};

export default UserList;
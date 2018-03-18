import { notificationsReducer, INotification, INotificationState } from './notificationsReducer';

describe('notificationsReducer', () => {
  it('should perform state transitions correctly', () => {
    const initialState: INotificationState = [];
    const notification: INotification =  { id: 1, message: "This is a notification", timestamp: new Date()};
    const nextState: INotificationState = [ notification ];

    expect(
      notificationsReducer(
        initialState,
        { type: "Notification/Show", payload: notification }
      )
    ).toEqual(nextState);
  })
});

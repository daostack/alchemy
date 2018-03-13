import notificationsReducer, { ActionTypes } from './notificationsReducer';

describe('notificationsReducer', () => {
  it('should perform state transitions correctly', () => {
    const prev = {alert: Math.random().toString()};
    const next = {alert: Math.random().toString()};

    expect(
      notificationsReducer(
        prev,
        {type: ActionTypes.ALERT_SHOW, payload: next}
      )
    ).toEqual(next);

    expect(
      notificationsReducer(
        prev,
        {type: Math.random().toString}
      )
    ).toEqual({alert: ''});
  })
});

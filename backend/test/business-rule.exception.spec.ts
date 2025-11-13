import { BusinessRuleException } from '../src/common/exceptions/business-rule.exception';

describe('BusinessRuleException', () => {
  it('should expose message and status code', () => {
    const message = 'Regra de negócio violada';
    const exception = new BusinessRuleException(message);

    expect(exception.message).toBe(message);
    expect(exception.getStatus()).toBe(400);
  });
});

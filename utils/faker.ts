import { faker } from '@faker-js/faker';

export const fakeUser = () => {
  const username = `qa_${Date.now()}`;
  const email = faker.internet.email().toLowerCase();
  const password = 'Aa123456'; // fixed for test stability

  const phone =
    '0' +
    faker.helpers.arrayElement(['6', '8', '9']) +
    faker.number.int({ min: 10000000, max: 99999999 });

  return {
    username,
    email,
    password,
    phone,
  };
};
import { IgbPage } from './app.po';

describe('igb App', () => {
  let page: IgbPage;

  beforeEach(() => {
    page = new IgbPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});

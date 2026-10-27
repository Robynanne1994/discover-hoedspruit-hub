import { describe, expect, it } from 'vitest';
import { specialSocialLink } from './specialSocialLink';

describe('special social links', () => {
  it('uses the supplied label with the social link destination', () => {
    expect(specialSocialLink({ social_media_link: 'https://www.facebook.com/posts/123', social_media_label: 'Facebook Post' }))
      .toEqual({ href: 'https://www.facebook.com/posts/123', label: 'Facebook Post', platform: 'facebook' });
  });
  it('names the network so the row can show its mark', () => {
    expect(specialSocialLink({ social_media_link: 'instagram.com/p/abc', social_media_label: 'Instagram Post' })?.platform).toBe('instagram');
    expect(specialSocialLink({ social_media_link: 'https://www.instagram.com/p/abc', social_media_label: 'New Reel' })?.platform).toBe('instagram');
    expect(specialSocialLink({ social_media_link: 'https://fb.me/x', social_media_label: 'Facebook Post' })?.platform).toBe('facebook');
    expect(specialSocialLink({ social_media_link: 'https://www.tiktok.com/@hello/video/1', social_media_label: 'Video' })?.platform).toBe('other');
  });
  it('requires both populated fields', () => {
    expect(specialSocialLink({ social_media_link: 'https://facebook.com', social_media_label: ' ' })).toBeNull();
    expect(specialSocialLink({ social_media_label: 'Facebook Post' })).toBeNull();
  });
  it('accepts web addresses without a scheme', () => {
    expect(specialSocialLink({ social_media_link: 'www.facebook.com/posts/123', social_media_label: 'Facebook Post' })?.href)
      .toBe('https://www.facebook.com/posts/123');
  });
  it('rejects executable and malformed destinations', () => {
    for (const link of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'not a link']) {
      expect(specialSocialLink({ social_media_link: link, social_media_label: 'Facebook Post' })).toBeNull();
    }
  });
});
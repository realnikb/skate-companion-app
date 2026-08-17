create table public.content_pages (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    title text not null check (char_length(title) between 1 and 120),
    eyebrow text,
    summary text,
    body text not null default '',
    is_published boolean not null default false,
    last_edited_by text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.content_pages enable row level security;

create policy "Published pages are public"
    on public.content_pages for select
    using (is_published);

create policy "Studio administrators can read every page"
    on public.content_pages for select to authenticated
    using ((select public.is_studio_admin()));

create policy "Studio administrators can create pages"
    on public.content_pages for insert to authenticated
    with check ((select public.is_studio_admin()));

create policy "Studio administrators can update pages"
    on public.content_pages for update to authenticated
    using ((select public.is_studio_admin()))
    with check ((select public.is_studio_admin()));

grant select on public.content_pages to anon, authenticated;
grant insert, update on public.content_pages to authenticated;

insert into public.content_pages (slug, title, eyebrow, summary, body, is_published) values
('privacy', 'Privacy policy', 'Your data', 'How Skate Companion collects, uses and protects personal information.', $page$
## About this policy
This policy explains how Skate Companion handles personal information when you browse the site, create an account or take part in the community. Skate Companion is an unofficial fan service and is not affiliated with Electronic Arts.

## Information we collect
We may collect your email address and authentication details; profile details such as your display name, handle, avatar, biography, gaming IDs and social links; preferences such as controller type and stance; content you submit including posts, comments, reviews, crews, images, videos, tags and locations; and technical information needed to operate, secure and understand the service.

Information you add to a public profile, post, crew or contribution can be seen by other people. Please do not publish personal information that you do not want to be public.

## How we use information
We use personal information to provide accounts and community features, display content you choose to publish, personalise your experience, secure and moderate the service, respond to requests, meet legal obligations and improve Skate Companion.

Our lawful bases may include performing our contract with you, our legitimate interests in operating and protecting the service, complying with legal obligations and consent where it is specifically requested. You can withdraw consent at any time where processing relies on consent.

## Sharing and international transfers
We use service providers for hosting, databases, authentication, storage, email delivery and analytics. They process information on our behalf under appropriate contractual protections. Some providers may process information outside the UK; where required, we use an adequacy decision or approved contractual safeguards.

We may also disclose information where required by law, to protect users or the service, or as part of a business reorganisation. We do not sell personal information.

## Retention
We keep account information while your account is active and for a reasonable period afterwards where needed for security, disputes or legal compliance. Public contributions may remain after account closure when necessary to preserve community discussions, but we will remove or anonymise them where appropriate. Security logs, backups and moderation records are retained only for proportionate periods.

## Your rights
Depending on where you live, you may have rights to access, correct, erase, restrict or receive your information, and to object to certain processing. You may also complain to the UK Information Commissioner’s Office. Contact the site operator using the contact details published by Skate Companion to exercise a privacy right.

## Children
Skate Companion is reviewing the age groups likely to use its community features. We minimise collection, use privacy-friendly defaults and apply additional protections where children may access the service. Do not share a child’s precise location or other sensitive information in public content.

## Changes
We may update this policy as the service changes. Material changes will be highlighted on the site. The Studio publication date shown on this page indicates the latest revision.
$page$, true),
('terms', 'Terms of service', 'Using Skate Companion', 'The rules that apply when you access the site or join its community.', $page$
## Agreement
By creating an account or using Skate Companion, you agree to these terms. If you do not agree, do not use the service. Skate Companion is an unofficial fan service and is not endorsed by or affiliated with Electronic Arts.

## Your account
Provide accurate information, keep access to your email secure and tell us promptly if you believe your account has been compromised. You are responsible for activity carried out through your account. You must meet any minimum age and parental-consent requirements that apply where you live.

## Community content
You keep ownership of content you submit. You give Skate Companion a worldwide, non-exclusive, royalty-free licence to host, store, reproduce, adapt for technical display, publish and distribute that content for operating and promoting the service. This licence ends when the content is deleted, except where copies reasonably remain in backups, shared discussions or legal records.

Only submit content you have the right to use. Do not post another person’s private information or image without an appropriate basis or permission.

## Acceptable use
You must follow the Community guidelines. You may not use the service unlawfully; harass, threaten or deceive people; infringe intellectual-property or privacy rights; distribute malware or spam; evade safety measures; scrape the service without permission; or misuse location and meetup features.

## Moderation and reports
We may review, limit, remove or preserve content and may warn, suspend or terminate accounts where reasonably necessary to enforce these terms, protect users, investigate reports or comply with law. Users and affected people may report content. If you believe your content or account was actioned contrary to these terms, you may use the published complaints route and request a review. Nothing in these terms removes any right you may have to bring a claim for breach of contract.

## Availability
We may change, suspend or discontinue features. We aim to keep information useful and the service available, but do not promise that it will always be accurate, complete, uninterrupted or error-free.

## Liability
Nothing in these terms excludes liability that cannot legally be excluded. To the extent permitted by law, Skate Companion is not responsible for indirect or unforeseeable losses, user content, third-party services or actions taken based on community information. Consumer rights that apply to you remain unaffected.

## Ending use
You may stop using the service and request account deletion. We may suspend or end access for serious or repeated breaches, safety risks or legal requirements. Provisions intended to survive termination, including rights in previously shared content and liability provisions, will continue where applicable.

## Changes and law
We may update these terms and will give appropriate notice of material changes. These terms are governed by the applicable law of the part of the United Kingdom in which the operator is established, without removing mandatory rights you have under the law where you live.
$page$, true),
('community-guidelines', 'Community guidelines', 'Keep it rolling', 'Practical rules for a welcoming and safe Skate Companion community.', $page$
## Be good to each other
Skate Companion is for sharing knowledge, creativity and sessions. Treat people with respect. Disagreement is fine; harassment, humiliation, threats, stalking, hate and targeted abuse are not.

## Keep people safe
- Do not encourage violence, self-harm, dangerous challenges or criminal activity.
- Do not sexually exploit or endanger anyone, especially a child.
- Do not publish private information, precise real-world locations or private messages without permission.
- Do not use the site to groom, coerce or arrange unsafe contact with a child.
- Think carefully before sharing meetup details and use public places and trusted contacts.

## Post what you have the right to share
Respect copyright, trademarks, privacy and image rights. Credit creators where appropriate. Do not impersonate another person, crew or organisation, and do not falsely suggest an affiliation with Electronic Arts or another brand.

## No scams or manipulation
Do not post malware, phishing, fraud, misleading promotions, repetitive spam or artificial engagement. Do not evade blocks, suspensions, rate limits or moderation controls.

## Reporting and enforcement
Report content that may break these rules or the law. We consider context, severity, intent, impact and previous behaviour. Outcomes can include reduced visibility, removal, warnings, temporary restrictions or account termination. Serious matters may be preserved or referred to the appropriate authorities where legally required.

If we restrict your content or account, you may use the published complaints process to ask for a review. Do not retaliate against reporters or abuse the reporting system.
$page$, true),
('cookies', 'Cookie policy', 'Browser storage', 'How Skate Companion uses cookies and similar technologies.', $page$
## What browser storage is
Cookies and similar technologies, including local storage, allow a website to remember information on your device. This policy should be read with our Privacy policy.

## Essential technologies
We use technologies that are necessary to provide requested features, such as maintaining authentication, protecting forms, balancing traffic and remembering security choices. These cannot always be disabled through our controls because the service may not work without them.

## Preferences and measurement
We may use storage to remember interface preferences and to understand aggregate use of Skate Companion. Where consent is legally required, optional technologies will remain off until you choose to enable them. You can withdraw that choice as easily as you gave it.

## Third-party features
Embedded media, maps or social features may communicate with third-party providers. Where an integration is not essential, it should not load non-exempt storage until the required choice has been made.

## Managing storage
You can use any cookie controls provided on the site and your browser settings to review or delete stored information. Blocking essential storage may sign you out or prevent features from working.

## Updates
We will update this page when the technologies or providers used by Skate Companion materially change.
$page$, true);

comment on table public.content_pages is 'Studio-managed informational and policy pages.';

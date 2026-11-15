# Abhinandan Goyal | Reliability, by design

A responsive, editorial-style resume website based on the supplied resume PDF.
Warm ivory, forest green, considered typography, and a custom systems diagram;
no templates, third-party fonts, analytics, external assets, or runtime dependencies.

## Run in VS Code

Use Node.js 22 or later. Node.js 24 LTS is recommended for Azure App Service.

```powershell
npm start
```

Open **http://localhost:3000**. No package installation or build step is required.
`npm run dev` restarts the server when server files change; refresh the browser
after editing HTML or CSS.

```powershell
npm run check
npm test
```

To select another local port:

```powershell
$env:PORT = "3001"
npm start
```

## Features

- All five career roles, technical capabilities, certifications, awards, and education.
- Responsive layouts, keyboard-accessible role disclosures, mobile navigation,
  visible focus states, skip link, and reduced-motion support.
- Privacy-edited resume PDF download, LinkedIn as the only contact option,
  and a print layout that expands all roles and restores them afterward.
- Essential content, navigation, contact links, and PDF download work without JavaScript.
- An allowlisted static server, restrictive content security policy, and `/health` endpoint.

## Edit the resume

- [public/index.html](public/index.html): resume content, contact information, and metadata.
- [public/styles.css](public/styles.css): colors, responsive design, and print styles.
- [public/app.js](public/app.js): menu, section indicator, and print behavior.
- `public/resume.pdf`: downloadable PDF with email and phone details removed;
  preserve this redaction when updating the source.
- [server.js](server.js): HTTP server, public routes, and response headers.

The site deliberately does not invent project outcomes, client names, performance
metrics, certification verification links, or a headshot. Certification names and
career dates follow the supplied PDF; update these as your resume changes.
Email and phone details are omitted from both the website and downloadable PDF.
Location labels show only India, without city names.
The resume and LinkedIn link are publicly accessible when the web app is publicly
accessible, even if its GitHub repository is private. Review replacement PDFs
before deploying so removed contact details are not accidentally restored.

## GitHub repository

The source is published to
**[abja_microsoft/abhinandan-resume](https://github.com/abja_microsoft/abhinandan-resume)**
as a **private** repository, with `main` as the default branch. This workspace is
already connected to that repository through its `origin` remote.

After editing and testing, commit your changes and run `git push` to update GitHub.
For a new local copy, use:

```powershell
gh repo clone abja_microsoft/abhinandan-resume
```

Use a **private** repository for the source unless your enterprise explicitly allows
otherwise. Enterprise Managed User (EMU) permissions are controlled by your enterprise.
EMU accounts can own private repositories only when their enterprise permits it.
Organization-owned repositories also require repository-creation permission.

If an organization-owned repository is needed for GitHub Actions, ask your enterprise
administrator for an approved repository. To switch this workspace to it:

```powershell
git remote set-url origin https://github.com/YOUR-ORGANIZATION/abhinandan-resume.git
git push -u origin main
```

Never add access tokens, publish profiles, or Azure credentials to this repository.

## Create the Azure App Service in the portal

This project is ready for **App Service / Web App**, not a Static Web App.
It listens on `0.0.0.0` and uses Azure's `PORT` environment variable.
No database, paid API, build output, or application secret is needed.

1. In the Azure portal, choose **Create a resource > Web App**.
2. Select your approved subscription, resource group, and a unique app name.
3. Choose **Publish: Code**, **Runtime stack: Node 24 LTS**, and **Operating System: Linux**.
4. Choose a region and an appropriate App Service plan. Review the price before creating.
5. After creation, open **Settings > Configuration / Stack settings** (or **General settings**,
   depending on the portal layout). Set **Startup Command** to `npm start` and save.
6. Open **Deployment > Deployment Center**. Select **GitHub**, your repository owner,
   the resume repository, and the `main` branch.
7. Prefer **User-assigned identity** for GitHub Actions authentication, with an
   administrator's help if role assignment or identity creation is restricted.
   Review the generated workflow before saving.
8. After deployment succeeds, browse the default domain shown on the app's Overview
   page. Check `/health` for `{"status":"ok"}`. Optionally configure App Service
   **Health check** to use `/health`.

**Important EMU limitation:** GitHub-hosted Actions runners are not available for
personal repositories owned by managed user accounts. For the portal's default
GitHub Actions flow, prefer an approved **organization-owned repository** with
Actions enabled. If only a personal private repository is available, arrange an
approved self-hosted runner with your administrator or use ZIP deployment below.
An organization may also restrict GitHub app authorization or Azure deployment.

If any sign-in is required, initiate a fresh flow and complete it in **external
Microsoft Edge**, not VS Code's embedded browser. Enter credentials and MFA yourself.

### ZIP deployment alternative

If GitHub repository creation or Actions is restricted, create the App Service in
the portal as above, and deploy a ZIP from this repository using an already
authenticated Azure CLI. These commands do not create Azure resources:

```powershell
$zip = Join-Path $env:TEMP "abhinandan-resume.zip"
git archive --format=zip --output=$zip HEAD
az webapp deploy --resource-group YOUR-RESOURCE-GROUP --name YOUR-APP-NAME --src-path $zip --type zip
```

Commit updates before running `git archive`; it packages the committed version only.
Keep `package.json`, `server.js`, and `public` at the ZIP root.
Startup command remains `npm start`; this dependency-free app needs no remote build.

### References

- [Configure Node.js on App Service](https://learn.microsoft.com/azure/app-service/configure-language-nodejs)
- [App Service Deployment Center](https://learn.microsoft.com/azure/app-service/deploy-continuous-deployment)
- [Managed user account restrictions](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts)

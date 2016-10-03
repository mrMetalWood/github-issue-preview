var eyeIcon = '<svg style="fill: #6cc644; pointer-events: none;" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve" inkscape:version="0.48.5 r10040" width="100%" height="100%" sodipodi:docname="OpenEye_icon.svg"><metadata id="metadata13"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/></cc:Work></rdf:RDF></metadata><defs id="defs11"/><sodipodi:namedview pagecolor="#ffffff" bordercolor="#666666" borderopacity="1" objecttolerance="10" gridtolerance="10" guidetolerance="10" inkscape:pageopacity="0" inkscape:pageshadow="2" inkscape:window-width="1920" inkscape:window-height="1018" id="namedview9" showgrid="false" inkscape:snap-center="false" inkscape:snap-page="true" inkscape:zoom="13.906433" inkscape:cx="-11.972283" inkscape:cy="5.4738797" inkscape:window-x="-8" inkscape:window-y="-8" inkscape:window-maximized="1" inkscape:current-layer="Layer_1"/><g transform="matrix(1.0909091,0,0,1.0909091,-1.0909091,-3.1910634)" id="g3"><path inkscape:connector-curvature="0" d="M 12,8 C 7,8 1,14 1,14 c 0,0 6,6 11,6 5,0 11,-6 11,-6 0,0 -6,-6 -11,-6 z m 0,10 c -2.2,0 -4,-1.8 -4,-4 0,-2.2 1.8,-4 4,-4 2.2,0 4,1.8 4,4 0,2.2 -1.8,4 -4,4 z" id="path5"/><circle d="m 14,14 c 0,1.104569 -0.895431,2 -2,2 -1.104569,0 -2,-0.895431 -2,-2 0,-1.104569 0.895431,-2 2,-2 1.104569,0 2,0.895431 2,2 z" sodipodi:ry="2" sodipodi:rx="2" sodipodi:cy="14" sodipodi:cx="12" cx="12" cy="14" r="2" id="circle7"/></g></svg>';

const renderer = new marked.Renderer();
renderer.image = href => `<img src="${href}" style="max-width: 100%">`;

let GITHUB_TOKEN = '';

chrome.storage.sync.get({token: ''}, items => {
  GITHUB_TOKEN = items.token;
 });

class IssuePreview {
  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100; display: flex; align-items: center; justify-content: center";

    this.overlay = document.createElement('div');
    this.overlay.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5);";
    this.overlay.addEventListener('click', () => this.remove());

    this.content = document.createElement('div');
    this.content.style.cssText = "width: 800px; height: 80vh; background: #fff; padding: 40px 20px; overflow-y: auto; z-index: 101; position: relative;";

    this.status = document.createElement('div');
    this.status.style.cssText = "width: 100%; text-align: center; position: absolute; top: 0; left: 0";

    this.initButtons();
  }

  initButtons() {
    setTimeout(() => {
      const kanbanIssues = document.querySelectorAll(".issue-card");
      const issues = document.querySelectorAll(".float-left.col-9");
      const navItems = document.querySelectorAll(".reponav-item");
      const paginationItems = document.querySelectorAll(".pagination a");
      const urlPath = window.location.pathname;
      const isProjects = urlPath.indexOf('/projects') !== -1;
      const isIssues = urlPath.indexOf('/issues') !== -1;

      if (kanbanIssues && isProjects) {
        for (let i = 0; i < kanbanIssues.length; i++) {
          kanbanIssues[i].appendChild(this.createPreviewButton(35, 12));
        }
      }

      if (issues && isIssues) {
        for (let i = 0; i < issues.length; i++) {
          issues[i].style.position = 'relative';
          issues[i].appendChild(this.createPreviewButton(35, -14));
        }
      }

      if (navItems) {
        for (let i = 0; i < navItems.length; i++) {
          navItems[i].addEventListener('click', () => {
            this.initButtons();
          });
        }
      }

      if (paginationItems) {
        for (let i = 0; i < paginationItems.length; i++) {
          paginationItems[i].addEventListener('click', () => {
            this.initButtons();
          });
        }
      }

    }, 1250);
  }

  handlePreviewClick(event) {
    const issuePath = event
      .target
      .parentNode
      .querySelector("a[href*='/issues/']")
      .href
      .replace("https://github.com/", "");

    const issueUrl =
      "https://api.github.com/repos/" +
      issuePath +
      "?access_token=" +
      GITHUB_TOKEN;

    fetch(issueUrl)
      .then(response => response.json())
      .then(issue => {
        this.issue = {
          title: issue.title,
          number: issue.number,
          author: issue.user.login,
          body: issue.body,
          url: issue.html_url
        };

        fetch(`${issue.comments_url}?access_token=${GITHUB_TOKEN}`)
          .then(response => response.json())
          .then(comments => {
            this.issue.comments = comments.map(comment => ({
                body: comment.body,
                author: comment.user.login
            }));

            this.assemble();
          });
      });
  }

  assemble() {
    const {container, status, overlay, content, createComment} = this;
    const {title, number, author, body, comments, url} = this.issue;

    content.innerHTML = '';

    content.appendChild(status);

    const linkBar = document.createElement('div');
    linkBar.style.cssText = "display: flex; align-items:center; justify-content: space-between";

    const link = document.createElement('a');
    link.href = url;
    link.textContent = url;

    linkBar.appendChild(link);

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy Link';
    copyButton.type = 'button';
    copyButton.addEventListener('click', () => this.selectAndCopy(link));

    linkBar.appendChild(copyButton);
    content.appendChild(linkBar);


    const heading = document.createElement('h1');
    heading.style.margin = '5px 0 20px 0';
    heading.textContent = `${title} #${number}`;

    content.appendChild(heading);

    content.appendChild(createComment(author, body));

    comments.forEach(comment => {
      content.appendChild(createComment(comment.author, comment.body));
    })

    container.appendChild(overlay);
    container.appendChild(content);
    document.body.appendChild(container);
  }

  remove(event) {
    this.container.parentNode.removeChild(this.container);
  }

  createComment(author, content) {
    var comment = document.createElement('div');
    comment.style.marginBottom = '20px';
    comment.classList.add('timeline-comment');

    var header = document.createElement('div');
    header.classList.add('timeline-comment-header');
    header.innerHTML = `<b>${author}:</b>`;

    var body = document.createElement('div');
    body.classList.add('comment-body');
    body.innerHTML = marked(content, {renderer});

    comment.appendChild(header);
    comment.appendChild(body);

    return comment;
  }

  createPreviewButton(top, left) {
    const preview = document.createElement('span');

    preview.style.cssText = `width: 15px; height: 15px; position: absolute; top: ${top}px; left: ${left}px; cursor: pointer;`;
    preview.innerHTML = eyeIcon;

    preview.addEventListener('click', event =>
      this.handlePreviewClick(event));

    return preview;
  }

  selectAndCopy(link) {
    if (window.getSelection) {
      if (window.getSelection().empty) {
        window.getSelection().empty();
      }
      const range = document.createRange();
      range.selectNode(link);
      window.getSelection().addRange(range);
      this.copy();
    }
  }

  copy() {
    try {
      const successful = document.execCommand('copy');
      this.showSuccessStatus();
    } catch (err) {
      console.log('Oops, unable to copy');
    }
  }

  showSuccessStatus() {
    this.status.textContent = 'Link copied';
    this.status.style.cssText = 'height: 30px; background: #DFF2BF; width: 100%; position: absolute; top: 0; left: 0; display: flex; align-items: center; justify-content: center; color: #4F8A10;';

    setTimeout(() => {
      this.status.textContent = '';
      this.status.style.cssText = '';
    }, 1000);
  }
}

new IssuePreview();

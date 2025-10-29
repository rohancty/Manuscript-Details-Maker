document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('masterDate').value = today;

  ['masterName', 'masterDate', 'masterJournal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateNDJFields);
  });

  updateNDJFields();

  document.getElementById('copySubmission').addEventListener('click', () => copySection('submissionChecks', 'statusSubmission'));
  document.getElementById('copyFinal').addEventListener('click', () => copySection('finalDecision', 'statusFinal'));
  document.getElementById('copyAll').addEventListener('click', copyAll);
  document.getElementById('resetAll').addEventListener('click', resetForm);
  document.getElementById('addRound').addEventListener('click', addPeerRound);

  addPeerRound();
});

function updateNDJFields() {
  const name = document.getElementById('masterName').value.trim();
  const date = document.getElementById('masterDate').value.trim();
  const journal = document.getElementById('masterJournal').value.trim();
  const combined = [name, date, journal].filter(x => x).join(' ');
  document.querySelectorAll('.ndjField').forEach(e => (e.value = combined));
}

let roundCount = 0;

function addPeerRound() {
  roundCount++;
  const container = document.getElementById('peerRoundsContainer');
  const roundDiv = document.createElement('div');
  roundDiv.className = 'card round';
  roundDiv.dataset.round = roundCount;
  roundDiv.innerHTML = `
    <input type="hidden" class="ndjField">
    <div class="card-head">
      <h3>PEER REVIEW: R${roundCount - 1}</h3>
      <div class="card-actions">
        <button class="btn addReviewerBtn">+ Add Reviewer</button>
        <button class="btn" id="removeRound">Remove Round</button>
        <button class="btn" id="copyRound">Copy</button>
        <span class="status"></span>
      </div>
    </div>
    <div class="reviewers"></div>
  `;
  container.appendChild(roundDiv);
  updateNDJFields();

  const reviewersDiv = roundDiv.querySelector('.reviewers');
  addReviewer(reviewersDiv, `R${roundCount - 1}`);

  roundDiv.querySelector('.addReviewerBtn').addEventListener('click', () => addReviewer(reviewersDiv, `R${roundCount - 1}`));
  roundDiv.querySelector('#removeRound').addEventListener('click', () => roundDiv.remove());
  roundDiv.querySelector('#copyRound').addEventListener('click', () => {
    const text = buildRoundText(roundDiv);
    if (!text) {
      alert('Nothing to copy');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      const s = roundDiv.querySelector('.status');
      s.textContent = 'Copied';
      setTimeout(() => (s.textContent = ''), 1500);
    });
  });
}

function addReviewer(container, roundLabel) {
  const idx = container.children.length + 1;
  const div = document.createElement('div');
  div.className = 'reviewer';
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <strong>Reviewer #${idx} (${roundLabel})</strong>
      <button class="remove">Remove</button>
    </div>
    <div class="field"><label>Name:<input type="text" class="revName"></label></div>
    <div class="field"><label>Scopus link:<input type="text" class="revScopus"></label></div>
    <div class="field"><label>Expertise:<input type="text" class="revExpertise"></label></div>
    <div class="field"><label>Recommendation:<select class="revRecommendation"><option value=""></option><option>Accept</option><option>Minor revision</option><option>Major revision</option><option>Reject</option></select></label></div>
    <div class="field"><label>Opinion:<textarea class="revOpinion"></textarea></label></div>
  `;
  container.appendChild(div);
  div.querySelector('.remove').addEventListener('click', () => div.remove());
}

function buildRoundText(roundDiv) {
  const header = roundDiv.querySelector('.ndjField')?.value.trim() || '';
  let lines = [];
  const label = roundDiv.querySelector('h3').textContent;
  lines.push(label);
  if (header) lines.push(header);

  const reviewers = Array.from(roundDiv.querySelectorAll('.reviewer'));

  reviewers.forEach((r, i) => {
    const rn = r.querySelector('.revName')?.value.trim() || '';
    const sc = r.querySelector('.revScopus')?.value.trim() || '';
    const ex = r.querySelector('.revExpertise')?.value.trim() || '';
    const re = r.querySelector('.revRecommendation')?.value.trim() || '';
    const op = r.querySelector('.revOpinion')?.value.trim() || '';

    // Include this reviewer only if any field is filled
    if (rn || sc || ex || re || op) {
      lines.push(`Reviewer #${i + 1}:`);
      if (rn) lines.push(`Name: ${rn}`);
      if (sc) lines.push(`Scopus link: ${sc}`);
      if (ex) lines.push(`Expertise: ${ex}`);
      if (re) lines.push(`Recommendation: ${re}`);
      if (op) lines.push(`Opinion: ${op}`);
      lines.push(''); // blank line after reviewer
    }
  });

  return lines.join('\n').trim();
}

function buildSectionText(sectionId) {
  const section = document.getElementById(sectionId);
  const header = section.querySelector('.ndjField')?.value.trim() || '';
  let lines = [];

  if (sectionId === 'submissionChecks') {
    lines.push('SUBMISSION CHECKS:');
    if (header) lines.push(header);

    const transOpt = document.getElementById('transferOption')?.value.trim() || '';
    const transTxt = document.getElementById('transferText')?.value.trim() || '';
    if (transOpt || transTxt)
      lines.push('Transfer: ' + [transOpt, transTxt].filter(x => x).join(' - '));

    const similarityChecked = document.querySelector('input[name="similarityCheck"]:checked')?.value;
    const similarityNote = document.getElementById('similarityCheckText')?.value.trim() || '';
    if (similarityChecked) {
      lines.push(`Similarity Check: ${similarityChecked}${similarityNote ? ' - ' + similarityNote : ''}`);
    } else if (similarityNote) {
      lines.push(`Similarity Check: ${similarityNote}`);
    }

    const duplicateChecked = document.querySelector('input[name="duplicateScore"]:checked')?.value;
    const duplicateNote = document.getElementById('duplicateScoreText')?.value.trim() || '';
    if (duplicateChecked) {
      lines.push(`Duplicate Score: ${duplicateChecked}${duplicateNote ? ' - ' + duplicateNote : ''}`);
    } else if (duplicateNote) {
      lines.push(`Duplicate Score: ${duplicateNote}`);
    }

    const ethicalNA = document.getElementById('ethicalNA')?.checked;
    const ethicalTxt = document.getElementById('ethicalText')?.value.trim() || '';
    if (ethicalNA) lines.push('Ethical approval: N/A');
    else if (ethicalTxt) lines.push('Ethical approval: ' + ethicalTxt);

    // Scope
    const scopeOpt = document.getElementById('scopeSelect')?.value.trim() || '';
    const scopeTxt = document.getElementById('scopeText')?.value.trim() || '';
    if (scopeOpt || scopeTxt)
      lines.push('Scope: ' + [scopeOpt, scopeTxt].filter(x => x).join(' - '));

    // Authorship
    const authorChecked = document.querySelector('input[name="authorsOrder"]:checked')?.value;
    const authorNote = document.getElementById('authorsOrderText')?.value.trim() || '';
    if (authorChecked) {
      lines.push(`Authorship: ${authorChecked}${authorNote ? ' - ' + authorNote : ''}`);
    } else if (authorNote) {
      lines.push(`Authorship: ${authorNote}`);
    }

    // Title
    const titleChecked = document.querySelector('input[name="titleCheck"]:checked')?.value;
    const titleNote = document.getElementById('titleCheckText')?.value.trim() || '';
    if (titleChecked) {
      lines.push(`Title: ${titleChecked}${titleNote ? ' - ' + titleNote : ''}`);
    } else if (titleNote) {
      lines.push(`Title: ${titleNote}`);
    }

    // Graphical Abstract / Highlights / Figures
    ['graphical', 'highlights', 'figures'].forEach(id => {
      const selVal = document.getElementById(id + 'Select')?.value.trim() || '';
      const txtVal = document.getElementById(id + 'Text')?.value.trim() || '';
      if (selVal || txtVal) {
        const label = id === 'graphical' ? 'Graphical Abstract' : id.charAt(0).toUpperCase() + id.slice(1);
        lines.push(label + ': ' + [selVal, txtVal].filter(x => x).join(' - '));
      }
    });

    // Additional sections
    [
      ['creditStatementRadio', 'creditStatementText', 'CREDIT statement'],
      ['dataAvailabilityRadio', 'dataAvailabilityText', 'Data availability statement'],
      ['acknowledgementRadio', 'acknowledgementText', 'Acknowledgement'],
      ['fundingRadio', 'fundingText', 'Funding Information'],
      ['conflictInterestRadio', 'conflictInterestText', 'Conflict of Interest'],
      ['declarationAIRadio', 'declarationofAIText', 'Declaration of AI use']
    ].forEach(([radioName, textId, label]) => {
      const mark = document.querySelector(`input[name="${radioName}"]:checked`)?.value || '';
      const note = document.getElementById(textId)?.value.trim() || '';
      if (mark || note) {
        lines.push(`${label}: ${mark}${note ? ' - ' + note : ''}`);
      }
    });

    const exp = document.getElementById('expertiseNeeded')?.value.trim() || '';
    if (exp) lines.push('Potential Reviewer Expertise needed: ' + exp);

    const op = document.getElementById('opinion')?.value.trim() || '';
    if (op) lines.push('Opinion: ' + op);
} else if (sectionId === 'finalDecision') {
  lines.push('DECISION:');
  if (header) lines.push(header);

  // Decision Type (Interim / Final)
  const decisionType = document.querySelector('input[name="decisionType"]:checked')?.value || '';
  if (decisionType) lines.push(`Decision Type: ${decisionType}`);

  // Notes
  const notes = document.getElementById('finalNotes')?.value.trim() || '';
  if (notes) lines.push(`Notes:\n${notes}`);
}


  return lines.join('\n').trim();
}

function copySection(sectionId, statusId) {
  const text = buildSectionText(sectionId);
  if (!text) {
    showStatus(statusId, 'Nothing to copy', 2000);
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => showStatus(statusId, 'Copied', 1500))
    .catch(() => showStatus(statusId, 'Copy failed', 2000));
}

function copyAll() {
  const parts = [];
  const sub = buildSectionText('submissionChecks');
  if (sub) parts.push(sub);

  Array.from(document.querySelectorAll('#peerRoundsContainer .round')).forEach(r => {
    const t = buildRoundText(r);
    if (t) parts.push(t);
  });

  const fin = buildSectionText('finalDecision');
  if (fin) parts.push(fin);

  const out = parts.join('\n\n').trim();

  if (!out) {
    showStatus('statusAll', 'Nothing to copy', 2000);
    return;
  }

  navigator.clipboard.writeText(out)
    .then(() => showStatus('statusAll', 'Copied all', 1500))
    .catch(() => showStatus('statusAll', 'Copy failed', 2000));
}

function showStatus(id, msg, ms = 1500) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  setTimeout(() => (el.textContent = ''), ms);
}

function resetForm() {
  const masterName = document.getElementById('masterName').value;
  const masterDate = document.getElementById('masterDate').value;
  const masterJournal = document.getElementById('masterJournal').value;

  document.querySelectorAll('input,textarea,select').forEach(el => {
    if (el.id === 'masterName' || el.id === 'masterDate' || el.id === 'masterJournal') return;
    if (el.classList.contains('ndjField')) {
      el.value = masterName + ' ' + masterDate + ' ' + masterJournal;
      return;
    }
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
    else el.value = '';
  });

  document.getElementById('peerRoundsContainer').innerHTML = '';
  roundCount = 0;
  addPeerRound();
  updateNDJFields();
}

// ===== HELP SIDEBAR =====
(function() {
  function initHelpSidebar() {
    const helpBtn = document.getElementById('helpBtn');
    const helpSidebar = document.getElementById('helpSidebar');
    const closeHelp = document.getElementById('closeHelp');

    if (!helpBtn || !helpSidebar || !closeHelp) return;

    const openSidebar = () => {
      helpSidebar.classList.add('open');
      setTimeout(() => document.addEventListener('click', handleOutsideClick), 0);
    };

    const closeSidebar = () => {
      helpSidebar.classList.remove('open');
      document.removeEventListener('click', handleOutsideClick);
    };

    const handleOutsideClick = (e) => {
      if (!helpSidebar.contains(e.target) && e.target !== helpBtn) {
        closeSidebar();
      }
    };

    helpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (helpSidebar.classList.contains('open')) closeSidebar();
      else openSidebar();
    });

    closeHelp.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSidebar();
    });

    helpSidebar.addEventListener('click', (e) => e.stopPropagation());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHelpSidebar);
  } else {
    initHelpSidebar();
  }
})();
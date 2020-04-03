import React from 'react';
import classNames from 'classnames';

// {
//   tracks: {total: 1061, progress: 1061},
//   playlists: {total: 505, progress: 195},
//   albums: {total: 505, progress: 195},
// }

const Job = (job, jobProgress) => {

  const importing = !job || job.finished;
  const types = ['tracks', 'albums', 'playlists'];
  const hasProgress = types.reduce(
    (hasProgress, type) => hasProgress || !!(jobProgress[type] && jobProgress[type].progress),
    false
  );

  const Progress = (type) => {
    const data = jobProgress[type];
    const progress = data && formatPercent(data.progress/data.total) || 0;
    const done = progress === 100;
    const waiting = progress === 0;
    const active = !done && !waiting;
    return (
      <li className={classNames({done, waiting, active})}>
        {done && <span className="glyphicon glyphicon-ok"></span>}
        {active && <span className="glyphicon glyphicon-repeat"></span>}
        {waiting && <span className="glyphicon glyphicon-time"></span>}
        &nbsp;{type} ({progress}%)
      </li>
    );
  }

  return (
    <div className="splash job-progress">
      {!job && <div>loading...</div>}
      {job && !hasProgress && <div>preparing import...</div>}
      {hasProgress && (
        <div>
          <div>importing collection...</div>
          <ul className="list-unstyled">
            {types.map(type => Progress(type))}
          </ul>
        </div>
      )}
    </div>
  );
};

const formatPercent = (progress) => Math.round(progress * 100);

export default Job; 

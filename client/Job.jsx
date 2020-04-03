import React from 'react';

// {
//   tracks: {total: 1061, progress: 1061},
//   playlists: {total: 505, progress: 195},
//   albums: {total: 505, progress: 195},
// }

const Job = (job, jobProgress) => {

  const importing = !job || job.finished;
  const types = ['tracks', 'albums', 'playlists'];
  const hasProgress = types.reduce((hasProgress, type) => hasProgress || jobProgress[type].progress);

  const Progress = (type) => {
    const data = jobProgress[type];
    const progress = data && formatPercent(data.progress/data.total) || 0;
    const active = progress != 0 && progress != 100;
    return (
      <div className={active ? 'row active' : 'row'}>
        <div className="col-xs-6 text-right">{type}:</div>
        <div className="col-xs-6 text-left">{progress}%</div>
      </div>
    );
  }

  return (
    <div className="splash job-progress">
      {!job && <div>loading...</div>}
      {job && !hasProgress && <div>preparing import</div>}
      {hasProgress && (
        <div>
          <div className="row">
            <div className="col-xs-6 text-right">importing...</div>
          </div>
          {types.map(type => Progress(type))}
        </div>
      )}
    </div>
  );
};

const formatPercent = (progress) => Math.round(progress * 100);

export default Job; 

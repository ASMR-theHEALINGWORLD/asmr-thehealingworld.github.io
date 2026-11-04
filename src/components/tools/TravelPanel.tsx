import { formatClock } from '../../store/dates';
import { sessionActions, useSession } from '../../store/session';

const OPTIONS = [3, 5, 10, 20];

/** 월드 여행 모드: 정해진 시간마다 다음 월드로 */
export function TravelPanel() {
  const travel = useSession((s) => s.travel);
  const now = useSession((s) => s.now);
  return (
    <div className="panel">
      <p className="panel__title">🧭 월드 여행 모드</p>
      <div className="panel__body">
        {travel.on ? (
          <>
            <p className="panel__desc">{travel.minutes}분마다 다음 월드로 천천히 넘어가요.</p>
            <p className="panel__big">{formatClock(travel.nextAt - now)}</p>
            <button className="pill" onClick={() => sessionActions.setTravel(false)}>
              여행 멈추기
            </button>
          </>
        ) : (
          <>
            <p className="panel__desc">틀어두기만 하면 6개의 월드를 차례로 여행해요.</p>
            <div className="chips">
              {OPTIONS.map((m) => (
                <button key={m} className="chip" onClick={() => sessionActions.setTravel(true, m)}>
                  {m}분마다
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

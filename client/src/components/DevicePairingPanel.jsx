import { useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config.js'
import useAuth from '../hooks/useAuth.js'
import { createPairingCode, formatPairingCode } from '../services/pairing.js'

function DevicePairingPanel() {
  const { user } = useAuth()
  const [pairing, setPairing] = useState(null)
  const [devices, setDevices] = useState([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !db) return undefined

    const devicesQuery = query(
      collection(db, 'deviceLinks'),
      where('guardianUid', '==', user.uid),
    )

    return onSnapshot(
      devicesQuery,
      (snapshot) => {
        setDevices(snapshot.docs.map((device) => ({ id: device.id, ...device.data() })))
      },
      () => setError('연결된 기기 정보를 불러오지 못했어요.'),
    )
  }, [user])

  const handleCreateCode = async () => {
    if (!user || !db) return

    setCreating(true)
    setError('')

    try {
      setPairing(await createPairingCode(db, user.uid))
    } catch {
      setError('연결 코드를 만들지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!pairing) return

    try {
      await navigator.clipboard.writeText(formatPairingCode(pairing.code))
    } catch {
      setError('자동 복사가 안 됐어요. 화면의 코드를 직접 입력해 주세요.')
    }
  }

  const handleDisconnect = async (deviceId) => {
    if (!db || !window.confirm('이 당사자 기기의 연결을 해제할까요?')) return

    setError('')

    try {
      await deleteDoc(doc(db, 'deviceLinks', deviceId))
    } catch {
      setError('기기 연결을 해제하지 못했어요. 다시 시도해 주세요.')
    }
  }

  return (
    <section className="info-panel pairing-panel">
      <div className="pairing-heading">
        <div className="panel-title-group">
          <span className="panel-number" aria-hidden="true">01</span>
          <div>
            <p className="panel-label">기기 연결</p>
            <h2>당사자 휴대폰을 연결해요</h2>
          </div>
        </div>
      </div>

      <p className="pairing-description">
        시크릿 창이나 다른 휴대폰에서 당사자 기기 연결을 선택하고 아래 코드를 입력하세요.
      </p>

      {pairing ? (
        <div className="pairing-code-card" aria-live="polite">
          <span>10분 동안 사용할 수 있는 코드</span>
          <strong>{formatPairingCode(pairing.code)}</strong>
          <small>{pairing.expiresAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}까지 입력해 주세요.</small>
          <button type="button" className="secondary-button" onClick={handleCopy}>
            코드 복사
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="primary-button pairing-create-button"
          onClick={handleCreateCode}
          disabled={creating}
        >
          {creating ? '코드를 만들고 있어요...' : '새 연결 코드 만들기'}
        </button>
      )}

      {pairing ? (
        <button
          type="button"
          className="text-button"
          onClick={handleCreateCode}
          disabled={creating}
        >
          새 코드 다시 만들기
        </button>
      ) : null}

      <div className="connected-devices">
        <h3><span className={devices.length > 0 ? 'device-status-dot online' : 'device-status-dot'} />연결된 당사자 기기</h3>
        {devices.length === 0 ? (
          <p>아직 연결된 기기가 없어요.</p>
        ) : (
          devices.map((device, index) => (
            <div className="device-row" key={device.id}>
              <span>
                <strong>당사자 기기 {index + 1}</strong>
                <small>설정을 읽을 수 있어요.</small>
              </span>
              <button type="button" onClick={() => handleDisconnect(device.id)}>
                연결 해제
              </button>
            </div>
          ))
        )}
      </div>

      {error ? <p className="settings-message error" role="alert">{error}</p> : null}
    </section>
  )
}

export default DevicePairingPanel

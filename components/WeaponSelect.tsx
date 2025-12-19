"use client"

interface WeaponSelectProps {
  onSelect: (weapon: string) => void
}

export default function WeaponSelect({ onSelect }: WeaponSelectProps) {
  const weapons = [
    {
      id: "longsword",
      name: "롱소드",
      desc: "중거리 | 공속: 보통 | 공격력: 보통",
      icon: "⚔️",
    },
    {
      id: "dagger",
      name: "단검",
      desc: "근거리 | 공속: 빠름 | 공격력: 낮음",
      icon: "🗡️",
    },
    {
      id: "greatsword",
      name: "대검",
      desc: "광범위 | 공속: 느림 | 공격력: 높음",
      icon: "⚔️",
    },
    {
      id: "chainsaw",
      name: "전기톱",
      desc: "근거리 | 상시 자동 공격",
      icon: "🪚",
    },
  ]

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm p-8 rounded-lg border-2 border-amber-500 max-w-2xl">
      <h1 className="text-4xl font-bold text-amber-400 mb-2 text-center">검 로그라이크</h1>
      <p className="text-slate-300 text-center mb-8">무기를 선택하세요</p>

      <div className="grid grid-cols-2 gap-4">
        {weapons.map((weapon) => (
          <button
            key={weapon.id}
            onClick={() => onSelect(weapon.id)}
            className="bg-slate-700 hover:bg-slate-600 p-6 rounded-lg border-2 border-slate-600 hover:border-amber-500 transition-all"
          >
            <div className="text-4xl mb-2">{weapon.icon}</div>
            <h3 className="text-xl font-bold text-amber-400 mb-2">{weapon.name}</h3>
            <p className="text-sm text-slate-300">{weapon.desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-700/50 rounded text-sm text-slate-300">
        <p className="mb-2">
          <strong>조작법:</strong>
        </p>
        <p>WASD - 이동 | 마우스 - 시점 회전</p>
        <p>좌클릭 - 공격 | Q - 대쉬</p>
      </div>
    </div>
  )
}

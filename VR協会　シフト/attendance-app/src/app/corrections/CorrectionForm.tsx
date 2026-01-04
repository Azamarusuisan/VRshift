'use client'

import { submitCorrectionRequest } from '@/app/actions/corrections'

export default function CorrectionForm() {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <form action={submitCorrectionRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">対象日</label>
                        <input
                            name="target_date"
                            type="date"
                            required
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">項目</label>
                        <select
                            name="type"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="attendance">勤怠</option>
                            <option value="appointment">アポ数</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">修正後の値</label>
                        <input
                            name="after_value"
                            type="text"
                            placeholder="例: 5"
                            required
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">理由</label>
                        <input
                            name="reason"
                            type="text"
                            placeholder="打刻忘れのため"
                            required
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="px-6 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    申請を送信
                </button>
            </form>
        </div>
    )
}

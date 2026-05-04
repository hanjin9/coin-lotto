import { syncKoreanLottoDraw } from './korean-lotto-sync';
import { notifyOwner } from './_core/notification';

export interface ScheduledDrawJobResult {
  success: boolean;
  drawNumber: number;
  message: string;
}

export async function runOfficialKoreanLottoSync(drawNumber: number): Promise<ScheduledDrawJobResult> {
  try {
    const synced = await syncKoreanLottoDraw(drawNumber);
    if (!synced) {
      await notifyOwner({
        title: '로또 결과 동기화 실패',
        content: `회차 ${drawNumber}의 공식 결과를 아직 확정하지 못했습니다. API 응답을 확인해주세요.`,
      });

      return {
        success: false,
        drawNumber,
        message: '공식 결과 미확정 또는 응답 실패',
      };
    }

    await notifyOwner({
      title: '로또 결과 동기화 완료',
      content: `회차 ${drawNumber}의 한국 로또 결과가 동기화되었습니다.`,
    });

    return {
      success: true,
      drawNumber,
      message: '공식 결과 동기화 완료',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';

    await notifyOwner({
      title: '로또 스케줄러 오류',
      content: `회차 ${drawNumber} 동기화 중 오류가 발생했습니다: ${message}`,
    });

    return {
      success: false,
      drawNumber,
      message,
    };
  }
}

export function getWeeklyLottoAutomationPolicy() {
  return {
    closeSalesAtKst: '토요일 20:00',
    syncOfficialResultAtKst: '토요일 20:50',
    retryWindowMinutes: [10, 20, 40],
    principle: '공식 결과 확정 전에는 당첨자 정산을 절대 시작하지 않는다.',
  };
}

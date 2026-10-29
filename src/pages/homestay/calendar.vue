<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { ref, computed } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import dayjs from "dayjs";
import { getRooms, updateRoomInventory, getRoomCalendar } from "@/api/homestay";
import type { Room, RoomCalendarDay, RoomStatus } from "@/types/business";
import { ROOM_STATUS_TEXT } from "@/utils/constants";
import BottomPopup from "@/components/BottomPopup.vue";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const rooms = ref<Room[]>([]);
const loading = ref(true);
const roomId = ref("");
/** roomId -> (date -> 房历) */
const calendars = ref<Record<string, Record<string, RoomCalendarDay>>>({});

// 以「今天」为起点展示 7 天，避免写死日期导致与真实数据错位
const base = dayjs().format("YYYY-MM-DD");
const dates = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = dayjs(base).add(i, "day");
    return { date: d.format("YYYY-MM-DD"), label: d.format("MM-DD") };
  }),
);

const selected = ref<{ room: Room; date: string } | null>(null);
const show = ref(false);
const saving = ref(false);
const edit = ref({ price: 0, stock: 0, status: "OPEN" as RoomStatus });
/** 状态键（与 ROOM_STATUS_TEXT 顺序严格一致），picker 的 index 即此数组下标 */
const statusKeys = Object.keys(ROOM_STATUS_TEXT) as RoomStatus[];
const statusLabels = statusKeys.map((k) => tr(ROOM_STATUS_TEXT[k]));
/** 当前下拉选中项下标，避免直接绑定 index 数字到状态字符串 */
const statusIndex = computed(() => {
  const i = statusKeys.indexOf(edit.value.status);
  return i < 0 ? 0 : i;
});

function onStatusChange(e: any) {
  const idx = Number(e?.detail?.value ?? 0);
  const key = statusKeys[idx];
  if (key) edit.value.status = key;
}

async function load() {
  loading.value = true;
  try {
    const res = await getRooms();
    rooms.value = res.data ?? [];
    // 逐个房型拉取房历（数据量小，直接并发）
    const entries = await Promise.all(
      rooms.value.map(async (r) => {
        try {
          const cal = await getRoomCalendar(r.id);
          const map: Record<string, RoomCalendarDay> = {};
          (cal.data ?? []).forEach((c) => (map[c.date] = c));
          return [r.id, map] as const;
        } catch {
          return [r.id, {}] as const;
        }
      }),
    );
    calendars.value = Object.fromEntries(entries);
  } catch (e) {
    console.error("[calendar] 加载房态失败", e);
    rooms.value = [];
    calendars.value = {};
  } finally {
    loading.value = false;
  }
}

onLoad((q) => {
  if (q?.roomId) roomId.value = q.roomId as string;
});

onShow(load);

function cellOf(room: Room, date: string) {
  return calendars.value[room.id]?.[date];
}

function cellStock(room: Room, date: string) {
  const cell = cellOf(room, date);
  return cell ? cell.stock : room.stock;
}

function onCell(room: Room, date: string) {
  const cell = cellOf(room, date);
  selected.value = { room, date };
  edit.value = {
    price: cell ? cell.price : room.price,
    stock: cell ? cell.stock : room.stock,
    status: cell ? cell.status : room.status,
  };
  show.value = true;
}

async function onSave() {
  if (!selected.value || saving.value) return;
  const price = Number(edit.value.price);
  const stock = Number(edit.value.stock);
  if (!Number.isFinite(price) || price < 0) {
    uni.showToast({ title: tr("请输入正确的价格"), icon: "none" });
    return;
  }
  if (!Number.isInteger(stock) || stock < 0) {
    uni.showToast({ title: tr("请输入正确的库存"), icon: "none" });
    return;
  }
  saving.value = true;
  try {
    await updateRoomInventory(selected.value.room.id, selected.value.date, {
      price,
      stock,
      status: edit.value.status,
    });
    show.value = false;
    uni.showToast({ title: tr("已更新库存"), icon: "none" });
    await load();
  } catch (e) {
    console.error("[calendar] 更新房态失败", e);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view class="calendar" :class="qmClass">
    <MerchantNavbar :title="tr('库存日历')" show-back show-home />
    <LoadingState v-if="loading" :rows="3" />
    <EmptyState
      v-else-if="!rooms.length"
      :title="tr('暂无房型')"
      :description="tr('请先在「房间管理」中添加房型')"
    />

    <template v-else>
      <view class="calendar__scroll">
        <view class="calendar__table">
          <view class="calendar__row calendar__row--head">
            <view class="calendar__room-head">{{ tr("房型 / 日期") }}</view>
            <view v-for="d in dates" :key="d.date" class="calendar__date-head">{{ d.label }}</view>
          </view>
          <view v-for="room in rooms" :key="room.id" class="calendar__row" :class="{ active: room.id === roomId }">
            <view class="calendar__room-name">{{ room.name }}</view>
            <view
              v-for="d in dates"
              :key="d.date"
              class="calendar__cell"
              :class="{ 'calendar__cell--empty': cellStock(room, d.date) <= 0 }"
              @tap="onCell(room, d.date)"
            >
              {{ cellStock(room, d.date) }}
            </view>
          </view>
        </view>
      </view>

      <text class="calendar__hint">{{ tr("点击库存数字可修改当天价格 / 库存 / 营业状态") }}</text>

      <BottomPopup v-model:show="show" :title="selected ? `${selected.room.name} · ${selected.date}` : ''">
        <view v-if="selected" class="edit">
          <view class="edit__row">
            <text class="edit__label">{{ tr("当天价格") }}</text>
            <input v-model="edit.price" type="digit" class="edit__input" />
          </view>
          <view class="edit__row">
            <text class="edit__label">{{ tr("当天库存") }}</text>
            <input v-model="edit.stock" type="number" class="edit__input" />
          </view>
          <view class="edit__row">
            <text class="edit__label">{{ tr("营业状态") }}</text>
            <picker :range="statusLabels" :value="statusIndex" @change="onStatusChange">
              <view class="edit__picker">{{ tr(ROOM_STATUS_TEXT[edit.status]) }} ›</view>
            </picker>
          </view>
        </view>
        <template #footer>
          <view class="btn-primary" :class="{ 'btn-disabled': saving }" @tap="onSave">
            {{ tr(saving ? "保存中…" : "保存") }}
          </view>
        </template>
      </BottomPopup>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.calendar {
  min-height: 100vh;
  padding: 24rpx 0;
}

.calendar__scroll {
  overflow-x: auto;
  overflow-y: hidden;
}

.calendar__table {
  min-width: 1000rpx;
  background: $surface;
  border-radius: $radius-md;
  margin: 0 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 28rpx rgba(38, 53, 42, 0.06);
}

.calendar__row {
  display: flex;
  border-bottom: 1rpx solid $line-2;

  &:last-child {
    border-bottom: none;
  }

  &--head {
    background: $green-soft;
  }

  &.active {
    background: var(--qm-soft, #eaf0ec);
  }
}

.calendar__room-head,
.calendar__room-name {
  width: 200rpx;
  flex-shrink: 0;
  padding: 26rpx 16rpx;
  font-size: 26rpx;
  color: $text-main;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.calendar__date-head,
.calendar__cell {
  flex: 1;
  min-width: 108rpx;
  text-align: center;
  padding: 26rpx 8rpx;
  font-size: 26rpx;
  color: $text-sub;
}

.calendar__cell {
  color: $green;
  font-weight: 600;

  &--empty {
    color: $danger;
  }
}

.calendar__hint {
  display: block;
  text-align: center;
  margin-top: 24rpx;
  font-size: 22rpx;
  color: $text-mute;
}

.edit {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.edit__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.edit__label {
  font-size: 26rpx;
  color: $text-sub;
}

.edit__input {
  flex: 1;
  height: 72rpx;
  padding: 0 24rpx;
  text-align: right;
  border-radius: $radius-sm;
  background: $green-soft;
  font-size: 28rpx;
}

.edit__picker {
  font-size: 28rpx;
  color: $text-main;
}

.btn-disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>

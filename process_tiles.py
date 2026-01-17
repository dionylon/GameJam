import os
import sys

# 尝试导入 Pillow 库
try:
    from PIL import Image
except ImportError:
    print("需要安装 Pillow 库来处理图片。")
    print("请运行: pip install Pillow")
    sys.exit(1)

def process_tiles(source_path="tiles.png", output_dir="public/tiles"):
    # 检查源文件是否存在
    if not os.path.exists(source_path):
        print(f"错误: 找不到文件 '{source_path}'")
        print("请将您的 3x3素材图 重命名为 'tiles.png' 并放在项目根目录下。")
        return

    # 确保输出目录存在
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"创建目录: {output_dir}")

    # 定义图标对应的名称（顺序必须与图片中的3x3网格一致）
    # 顺序: 第一行(左->右), 第二行(左->右), 第三行(左->右)
    tile_names = [
        "carrot", "fire", "grass",
        "stump", "corn", "wool",
        "brush", "bucket", "milk"
    ]

    try:
        img = Image.open(source_path)
        img_width, img_height = img.size
        
        # 计算每个格子的宽高
        tile_w = img_width // 3
        tile_h = img_height // 3

        print(f"图片尺寸: {img_width}x{img_height}")
        print(f"单个切片尺寸: {tile_w}x{tile_h}")

        for i, name in enumerate(tile_names):
            row = i // 3
            col = i % 3

            left = col * tile_w
            top = row * tile_h
            right = left + tile_w
            bottom = top + tile_h

            # 切割
            crop = img.crop((left, top, right, bottom))

            # 简单的去除白边或调整（可选，这里不做复杂处理，只保存）
            # 如果需要透明背景，可以在这里添加去底逻辑，但通常由素材本身决定

            # 保存
            save_path = os.path.join(output_dir, f"{name}.png")
            crop.save(save_path, "PNG")
            print(f"已保存: {save_path}")

        print("\n✅ 所有图片处理完成！")
        print("请确保在游戏设置中开启 '使用图片素材' 即可查看效果。")

    except Exception as e:
        print(f"处理过程中出错: {e}")

if __name__ == "__main__":
    # 如果用户提供了命令行参数作为文件名
    source = sys.argv[1] if len(sys.argv) > 1 else "tiles.png"
    process_tiles(source)
